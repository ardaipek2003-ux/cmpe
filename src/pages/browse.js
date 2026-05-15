import { api, navigate } from '../main.js';

export async function renderBrowse(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>Exhibition</h1>
      <p>Curated photography, film, and soundscapes.</p>
    </div>
    <div id="stats-bar" class="stats-bar"></div>
    <div class="search-panel" id="search-panel">
      <h2>Search</h2>
      <div class="search-grid">
        <div class="form-group" style="margin:0">
          <label class="form-label" for="search-name">Artist / Subject</label>
          <input class="form-input" type="text" id="search-name" placeholder="e.g. Gurgen, Fikret" />
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label" for="search-country">Region</label>
          <select class="form-select" id="search-country"><option value="">All Regions</option></select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label" for="search-year">Timeline</label>
          <select class="form-select" id="search-year"><option value="">All Years</option></select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label" for="search-type">Medium</label>
          <select class="form-select" id="search-type">
            <option value="">All Mediums</option>
            <option value="photo">Photography</option>
            <option value="video">Film</option>
            <option value="audio">Sound</option>
          </select>
        </div>
        <div class="search-actions">
          <button class="btn btn-primary" id="search-btn">Discover</button>
          <button class="btn btn-secondary" id="clear-btn">Reset</button>
        </div>
      </div>
    </div>
    <div id="results-info" style="margin-bottom:24px;font-family:var(--font-display);font-weight:700;text-transform:uppercase;color:var(--text-secondary)"></div>
    <div id="media-grid" class="media-grid"></div>
    <div id="pagination" class="pagination"></div>
  `;

  let currentPage = 1;

  // Load filter options
  try {
    const [countries, years, stats] = await Promise.all([
      api('/countries'), api('/years'), api('/stats')
    ]);
    const countrySelect = container.querySelector('#search-country');
    countries.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; countrySelect.appendChild(o); });
    const yearSelect = container.querySelector('#search-year');
    years.forEach(y => { const o = document.createElement('option'); o.value = y; o.textContent = y; yearSelect.appendChild(o); });

    // Stats bar - hidden in new design, but keep logic
  } catch (e) { console.error(e); }

  async function loadMedia(page = 1) {
    currentPage = page;
    const grid = container.querySelector('#media-grid');
    grid.innerHTML = '<div class="spinner" style="grid-column:1/-1"></div>';
    const params = new URLSearchParams();
    const name = container.querySelector('#search-name').value.trim();
    const country = container.querySelector('#search-country').value;
    const year = container.querySelector('#search-year').value;
    const type = container.querySelector('#search-type').value;
    if (name) params.set('name', name);
    if (country) params.set('country', country);
    if (year) params.set('year', year);
    if (type) params.set('type', type);
    params.set('page', page);
    params.set('limit', 12);

    try {
      const data = await api(`/media?${params}`);
      const info = container.querySelector('#results-info');
      info.textContent = `Showing ${data.items.length} of ${data.total} works`;

      if (data.items.length === 0) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>No works found</h3><p>Try adjusting your search filters.</p></div>`;
      } else {
        grid.innerHTML = data.items.map(item => `
          <div class="media-card fade-in" data-id="${item.PhotoID}">
            <div class="media-card-img-wrapper">
              <img class="media-card-img" src="${item.ThumbnailURL}" alt="${item.Title}" loading="lazy" onerror="this.style.background='#dcd8ce';this.alt=''" />
            </div>
            <div class="media-card-body">
              <div class="media-card-title">${item.Title}</div>
              <div class="media-card-meta">
                <span class="media-badge ${item.MediaType}">${item.MediaType}</span>
                <span>${item.Country}</span>
                <span>${item.Year}</span>
              </div>
            </div>
          </div>
        `).join('');

        grid.querySelectorAll('.media-card').forEach(card => {
          card.onclick = () => navigate('detail', { id: card.dataset.id });
        });
      }

      // Pagination
      const pag = container.querySelector('#pagination');
      if (data.totalPages > 1) {
        let html = '';
        if (currentPage > 1) html += `<button class="page-btn" data-page="${currentPage - 1}">‹</button>`;
        for (let i = 1; i <= data.totalPages; i++) {
          html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        if (currentPage < data.totalPages) html += `<button class="page-btn" data-page="${currentPage + 1}">›</button>`;
        pag.innerHTML = html;
        pag.querySelectorAll('.page-btn').forEach(btn => {
          btn.onclick = () => loadMedia(parseInt(btn.dataset.page));
        });
      } else { pag.innerHTML = ''; }
    } catch (e) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="icon">⚠️</div><h3>Error loading media</h3><p>${e.message}</p></div>`;
    }
  }

  container.querySelector('#search-btn').onclick = () => loadMedia(1);
  container.querySelector('#clear-btn').onclick = () => {
    container.querySelector('#search-name').value = '';
    container.querySelector('#search-country').value = '';
    container.querySelector('#search-year').value = '';
    container.querySelector('#search-type').value = '';
    loadMedia(1);
  };
  container.querySelector('#search-name').onkeydown = (e) => { if (e.key === 'Enter') loadMedia(1); };

  loadMedia(1);
}
