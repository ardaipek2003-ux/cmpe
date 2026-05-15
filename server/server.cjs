const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bcryptjs = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { getDb } = require('./db.cjs');

const SQLiteStore = require('connect-sqlite3')(session);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(session({
  store: new SQLiteStore({
    dir: process.env.DB_DIR || __dirname,
    db: 'sessions.db'
  }),
  secret: 'photolab-album-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Serve media files
app.use('/media', express.static(path.join(__dirname, 'media')));

// Initialize DB
const db = getDb();

// ═══════════════════════════════════════════
// AUTH ENDPOINTS
// ═══════════════════════════════════════════

// Register
app.post('/api/auth/register', (req, res) => {
  const { username, password, firstName, lastName, email, mailingAddress } = req.body;

  // Validation
  if (!username || !password || !firstName || !lastName || !email || !mailingAddress) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  // Check existing
  const existing = db.prepare('SELECT UserID FROM User WHERE Username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const hash = bcryptjs.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO User (Username, Password, FirstName, LastName, Email, MailingAddress) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(username, hash, firstName, lastName, email, mailingAddress);

  req.session.userId = result.lastInsertRowid;

  res.json({
    success: true,
    user: { id: result.lastInsertRowid, username, firstName, lastName, email, mailingAddress }
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.prepare('SELECT * FROM User WHERE Username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'No account found with this username. Please register first.' });
  }

  if (!bcryptjs.compareSync(password, user.Password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  req.session.userId = user.UserID;

  res.json({
    success: true,
    user: {
      id: user.UserID,
      username: user.Username,
      firstName: user.FirstName,
      lastName: user.LastName,
      email: user.Email,
      mailingAddress: user.MailingAddress
    }
  });
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = db.prepare('SELECT * FROM User WHERE UserID = ?').get(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  res.json({
    user: {
      id: user.UserID,
      username: user.Username,
      firstName: user.FirstName,
      lastName: user.LastName,
      email: user.Email,
      mailingAddress: user.MailingAddress
    }
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// ═══════════════════════════════════════════
// MEDIA ENDPOINTS
// ═══════════════════════════════════════════

// Browse / search media
app.get('/api/media', (req, res) => {
  const { name, country, year, type, page = 1, limit = 12 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let where = [];
  let params = [];

  if (country) {
    where.push('p.Country = ?');
    params.push(country);
  }
  if (year) {
    where.push('p.Year = ?');
    params.push(parseInt(year));
  }
  if (type) {
    where.push('p.MediaType = ?');
    params.push(type);
  }
  if (name) {
    const names = name.split(',').map(n => n.trim()).filter(n => n.length > 0);
    if (names.length > 0) {
      const nameClauses = names.map(() => 
        `(
          p.PhotoID IN (SELECT a.PhotoID FROM Appearance a JOIN Person pe ON a.PersonID = pe.PersonID WHERE pe.FirstName LIKE ? OR pe.LastName LIKE ?)
          OR p.Title LIKE ? 
          OR p.Description LIKE ?
        )`
      );
      where.push('(' + nameClauses.join(' AND ') + ')');
      for (const n of names) {
        params.push(`%${n}%`, `%${n}%`, `%${n}%`, `%${n}%`);
      }
    }
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  // Count total
  const countQuery = `SELECT COUNT(DISTINCT p.PhotoID) as total FROM Photo p ${whereClause}`;
  const { total } = db.prepare(countQuery).get(...params);

  // Get results with people
  const query = `
    SELECT DISTINCT p.* FROM Photo p
    ${whereClause}
    ORDER BY p.Year DESC, p.PhotoID DESC
    LIMIT ? OFFSET ?
  `;
  const items = db.prepare(query).all(...params, parseInt(limit), offset);

  // Get appearances for each
  const getAppearances = db.prepare(`
    SELECT pe.FirstName, pe.LastName, pe.Country as PersonCountry
    FROM Appearance a
    JOIN Person pe ON a.PersonID = pe.PersonID
    WHERE a.PhotoID = ?
  `);

  const enrichedItems = items.map(item => ({
    ...item,
    people: getAppearances.all(item.PhotoID)
  }));

  res.json({
    items: enrichedItems,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit))
  });
});

// Get single media item
app.get('/api/media/:id', (req, res) => {
  const photo = db.prepare('SELECT * FROM Photo WHERE PhotoID = ?').get(req.params.id);
  if (!photo) {
    return res.status(404).json({ error: 'Media not found' });
  }

  const people = db.prepare(`
    SELECT pe.PersonID, pe.FirstName, pe.LastName, pe.Country
    FROM Appearance a
    JOIN Person pe ON a.PersonID = pe.PersonID
    WHERE a.PhotoID = ?
  `).all(req.params.id);

  res.json({ ...photo, people });
});

// Get all persons (for search)
app.get('/api/persons', (req, res) => {
  const persons = db.prepare('SELECT * FROM Person ORDER BY FirstName, LastName').all();
  res.json(persons);
});

// Get all countries
app.get('/api/countries', (req, res) => {
  const countries = db.prepare('SELECT DISTINCT Country FROM Photo ORDER BY Country').all();
  res.json(countries.map(c => c.Country));
});

// Get all years
app.get('/api/years', (req, res) => {
  const years = db.prepare('SELECT DISTINCT Year FROM Photo ORDER BY Year DESC').all();
  res.json(years.map(y => y.Year));
});

// ═══════════════════════════════════════════
// ORDER ENDPOINTS
// ═══════════════════════════════════════════

// Place order
app.post('/api/orders', requireAuth, (req, res) => {
  const { items, serviceType } = req.body;
  // items: [{ photoId, copies }]

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No items in order' });
  }

  const costPerCopy = { '1day': 0.30, '3day': 0.20, '1week': 0.10 };
  const cost = costPerCopy[serviceType];
  if (!cost) {
    return res.status(400).json({ error: 'Invalid service type' });
  }

  let totalCost = 0;
  for (const item of items) {
    totalCost += item.copies * cost;
  }

  const orderResult = db.prepare(
    'INSERT INTO PrintOrder (UserID, TotalCost, ServiceType) VALUES (?, ?, ?)'
  ).run(req.session.userId, totalCost, serviceType);

  const orderId = orderResult.lastInsertRowid;

  const insertItem = db.prepare(
    'INSERT INTO OrderItem (OrderID, PhotoID, Copies, CostPerCopy) VALUES (?, ?, ?, ?)'
  );

  for (const item of items) {
    insertItem.run(orderId, item.photoId, item.copies, cost);
  }

  // Get the full order
  const order = db.prepare('SELECT * FROM PrintOrder WHERE OrderID = ?').get(orderId);
  const orderItems = db.prepare(`
    SELECT oi.*, p.Title, p.ThumbnailURL, p.MediaType
    FROM OrderItem oi
    JOIN Photo p ON oi.PhotoID = p.PhotoID
    WHERE oi.OrderID = ?
  `).all(orderId);

  // Calculate available date
  const days = { '1day': 1, '3day': 3, '1week': 7 };
  const availableDate = new Date();
  availableDate.setDate(availableDate.getDate() + days[serviceType]);

  res.json({
    success: true,
    order: {
      ...order,
      items: orderItems,
      availableDate: availableDate.toISOString().split('T')[0]
    }
  });
});

// Get order history
app.get('/api/orders', requireAuth, (req, res) => {
  const orders = db.prepare(
    'SELECT * FROM PrintOrder WHERE UserID = ? ORDER BY OrderDate DESC'
  ).all(req.session.userId);

  const getItems = db.prepare(`
    SELECT oi.*, p.Title, p.ThumbnailURL, p.MediaType
    FROM OrderItem oi
    JOIN Photo p ON oi.PhotoID = p.PhotoID
    WHERE oi.OrderID = ?
  `);

  const days = { '1day': 1, '3day': 3, '1week': 7 };

  const enrichedOrders = orders.map(order => {
    const availableDate = new Date(order.OrderDate);
    availableDate.setDate(availableDate.getDate() + days[order.ServiceType]);
    return {
      ...order,
      items: getItems.all(order.OrderID),
      availableDate: availableDate.toISOString().split('T')[0]
    };
  });

  res.json(enrichedOrders);
});

// ═══════════════════════════════════════════
// STATISTICS ENDPOINT
// ═══════════════════════════════════════════

app.get('/api/stats', (req, res) => {
  const totalMedia = db.prepare('SELECT COUNT(*) as c FROM Photo').get().c;
  const totalPhotos = db.prepare("SELECT COUNT(*) as c FROM Photo WHERE MediaType = 'photo'").get().c;
  const totalVideos = db.prepare("SELECT COUNT(*) as c FROM Photo WHERE MediaType = 'video'").get().c;
  const totalAudio = db.prepare("SELECT COUNT(*) as c FROM Photo WHERE MediaType = 'audio'").get().c;
  const totalPeople = db.prepare('SELECT COUNT(*) as c FROM Person').get().c;
  const totalCountries = db.prepare('SELECT COUNT(DISTINCT Country) as c FROM Photo').get().c;
  const totalOrders = db.prepare('SELECT COUNT(*) as c FROM PrintOrder').get().c;

  res.json({
    totalMedia, totalPhotos, totalVideos, totalAudio,
    totalPeople, totalCountries, totalOrders
  });
});

// ═══════════════════════════════════════════
// SERVE FRONTEND (PRODUCTION)
// ═══════════════════════════════════════════

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Catch-all to serve index.html for single-page app routing
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ═══════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`📸 Photo Album API running on http://localhost:${PORT}`);
});
