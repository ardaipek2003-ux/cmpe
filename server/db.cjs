const Database = require('better-sqlite3');
const path = require('path');
const bcryptjs = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'album.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase();
  }
  return db;
}

function initializeDatabase() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS Person (
      PersonID INTEGER PRIMARY KEY AUTOINCREMENT,
      FirstName TEXT NOT NULL,
      LastName TEXT NOT NULL,
      Country TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Photo (
      PhotoID INTEGER PRIMARY KEY AUTOINCREMENT,
      Title TEXT NOT NULL,
      Description TEXT,
      MediaType TEXT NOT NULL DEFAULT 'photo' CHECK(MediaType IN ('photo','video','audio')),
      Country TEXT NOT NULL,
      Year INTEGER NOT NULL,
      ThumbnailURL TEXT,
      FullURL TEXT,
      DateAdded TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS Appearance (
      AppearanceID INTEGER PRIMARY KEY AUTOINCREMENT,
      PhotoID INTEGER NOT NULL,
      PersonID INTEGER NOT NULL,
      FOREIGN KEY (PhotoID) REFERENCES Photo(PhotoID),
      FOREIGN KEY (PersonID) REFERENCES Person(PersonID)
    );

    CREATE TABLE IF NOT EXISTS User (
      UserID INTEGER PRIMARY KEY AUTOINCREMENT,
      Username TEXT NOT NULL UNIQUE,
      Password TEXT NOT NULL,
      FirstName TEXT NOT NULL,
      LastName TEXT NOT NULL,
      Email TEXT NOT NULL,
      MailingAddress TEXT NOT NULL,
      CreatedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS PrintOrder (
      OrderID INTEGER PRIMARY KEY AUTOINCREMENT,
      UserID INTEGER NOT NULL,
      OrderDate TEXT DEFAULT (datetime('now')),
      TotalCost REAL NOT NULL,
      ServiceType TEXT NOT NULL CHECK(ServiceType IN ('1day','3day','1week')),
      Status TEXT NOT NULL DEFAULT 'Processing',
      FOREIGN KEY (UserID) REFERENCES User(UserID)
    );

    CREATE TABLE IF NOT EXISTS OrderItem (
      ItemID INTEGER PRIMARY KEY AUTOINCREMENT,
      OrderID INTEGER NOT NULL,
      PhotoID INTEGER NOT NULL,
      Copies INTEGER NOT NULL DEFAULT 1,
      CostPerCopy REAL NOT NULL,
      FOREIGN KEY (OrderID) REFERENCES PrintOrder(OrderID),
      FOREIGN KEY (PhotoID) REFERENCES Photo(PhotoID)
    );
  `);

  // Check if data already seeded
  const count = db.prepare('SELECT COUNT(*) as c FROM Photo').get();
  if (count.c > 0) return;

  console.log('Seeding database...');
  seedData();
  console.log('Database seeded successfully.');
}

function seedData() {
  // ── Persons ──
  const persons = [
    { FirstName: 'Vincent van', LastName: 'Gogh', Country: 'Dutch' },
    { FirstName: 'Edouard', LastName: 'Manet', Country: 'French' },
    { FirstName: 'Johannes', LastName: 'Vermeer', Country: 'Dutch' },
    { FirstName: 'Edgar', LastName: 'Degas', Country: 'French' },
    { FirstName: 'Rembrandt (Rembrandt van', LastName: 'Rijn)', Country: 'Dutch' },
    { FirstName: 'Paul', LastName: 'Cézanne', Country: 'French' },
    { FirstName: 'Auguste', LastName: 'Renoir', Country: 'French' },
    { FirstName: 'Fra Filippo', LastName: 'Lippi', Country: 'Italian' },
  ];

  const insertPerson = db.prepare(
    'INSERT INTO Person (FirstName, LastName, Country) VALUES (?, ?, ?)'
  );
  for (const p of persons) {
    insertPerson.run(p.FirstName, p.LastName, p.Country);
  }

  // ── Photos / Videos / Audios ──
  const photos = [
    { Title: 'Irises', Description: 'Vincent van Gogh - Masterpiece', MediaType: 'photo', Country: 'Dutch', Year: 1890, Thumbnail: '/media/art_436528.jpg' },
    { Title: 'Wheat Field with Cypresses', Description: 'Vincent van Gogh - Masterpiece', MediaType: 'photo', Country: 'Dutch', Year: 1889, Thumbnail: '/media/art_436535.jpg' },
    { Title: 'Boating', Description: 'Edouard Manet - Masterpiece', MediaType: 'photo', Country: 'French', Year: 1874, Thumbnail: '/media/art_436947.jpg' },
    { Title: 'The Monet Family in Their Garden at Argenteuil', Description: 'Edouard Manet - Masterpiece', MediaType: 'photo', Country: 'French', Year: 1874, Thumbnail: '/media/art_436965.jpg' },
    { Title: 'Young Woman with a Water Pitcher', Description: 'Johannes Vermeer - Masterpiece', MediaType: 'photo', Country: 'Dutch', Year: 1662, Thumbnail: '/media/art_437881.jpg' },
    { Title: 'Dancers, Pink and Green', Description: 'Edgar Degas - Masterpiece', MediaType: 'photo', Country: 'French', Year: 1890, Thumbnail: '/media/art_436140.jpg' },
    { Title: 'Self-Portrait', Description: 'Rembrandt van Rijn - Masterpiece', MediaType: 'photo', Country: 'Dutch', Year: 1660, Thumbnail: '/media/art_437397.jpg' },
    { Title: 'Still Life with Apples and a Pot of Primroses', Description: 'Paul Cézanne - Masterpiece', MediaType: 'photo', Country: 'French', Year: 1890, Thumbnail: '/media/art_435882.jpg' },
    { Title: 'A Woman Seated beside a Vase of Flowers', Description: 'Edgar Degas - Masterpiece', MediaType: 'photo', Country: 'French', Year: 1865, Thumbnail: '/media/art_436121.jpg' },
    { Title: 'Oleanders', Description: 'Vincent van Gogh - Masterpiece', MediaType: 'photo', Country: 'Dutch', Year: 1888, Thumbnail: '/media/art_436530.jpg' },
    { Title: 'Madame Georges Charpentier and Her Children', Description: 'Auguste Renoir - Masterpiece', MediaType: 'photo', Country: 'French', Year: 1878, Thumbnail: '/media/art_438815.jpg' },
    { Title: 'Portrait of a Woman with a Man at a Casement', Description: 'Fra Filippo Lippi - Masterpiece', MediaType: 'photo', Country: 'Italian', Year: 1440, Thumbnail: '/media/art_436896.jpg' },
  ];

  const insertPhoto = db.prepare(
    'INSERT INTO Photo (Title, Description, MediaType, Country, Year, ThumbnailURL, FullURL) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  for (const p of photos) {
    insertPhoto.run(p.Title, p.Description, p.MediaType, p.Country, p.Year, p.Thumbnail, p.Thumbnail);
  }

  // ── Appearances (linking people to photos) ──
  const appearances = [
    { PhotoID: 1, PersonID: 1 },
    { PhotoID: 2, PersonID: 1 },
    { PhotoID: 3, PersonID: 2 },
    { PhotoID: 4, PersonID: 2 },
    { PhotoID: 5, PersonID: 3 },
    { PhotoID: 6, PersonID: 4 },
    { PhotoID: 7, PersonID: 5 },
    { PhotoID: 8, PersonID: 6 },
    { PhotoID: 9, PersonID: 4 },
    { PhotoID: 10, PersonID: 1 },
    { PhotoID: 11, PersonID: 7 },
    { PhotoID: 12, PersonID: 8 },
  ];

  const insertAppearance = db.prepare(
    'INSERT INTO Appearance (PhotoID, PersonID) VALUES (?, ?)'
  );
  for (const a of appearances) {
    insertAppearance.run(a.PhotoID, a.PersonID);
  }

  // ── Demo User ──
  const hash = bcryptjs.hashSync('demo123', 10);
  db.prepare(
    'INSERT INTO User (Username, Password, FirstName, LastName, Email, MailingAddress) VALUES (?, ?, ?, ?, ?, ?)'
  ).run('demo', hash, 'Demo', 'User', 'demo@photolab.com', '123 Main St, Istanbul, Turkey');
}

module.exports = { getDb };
