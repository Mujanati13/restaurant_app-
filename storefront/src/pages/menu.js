import { api } from '../api.js';
import { openItemModal } from '../components/item-modal.js';

export async function renderMenuPage(params = {}) {
  const categories = await api.getCategories();
  const selectedCat = params.category || null;
  const searchQuery = params.search || '';
  const menuItems = await api.getMenus(selectedCat, searchQuery);

  return `
    <main class="section menu-page">
      <div class="container">
        <!-- Search & Filter Header -->
        <div class="page-intro menu-intro" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:1.5rem;margin-bottom:2rem;">
          <div>
            <h1 style="font-size:2.2rem;margin-bottom:0.25rem;">Our Culinary Menu</h1>
            <p style="color:var(--text-secondary);">Browse through our freshly handcrafted gourmet selections.</p>
          </div>

          <div style="position:relative;width:100%;max-width:360px;">
            <i class="ri-search-line" style="position:absolute;left:1rem;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:1.1rem;"></i>
            <input type="text" id="menu-search-input" class="form-control" style="padding-left:2.8rem;border-radius:var(--radius-full);" placeholder="Search dishes, ingredients..." value="${searchQuery}" />
          </div>
        </div>

        <!-- Categories Navigation Tabs -->
        <div class="category-bar">
          <button class="category-tab ${!selectedCat ? 'active' : ''}" data-cat="">
            All Items
          </button>
          ${categories.map(cat => `
            <button class="category-tab ${selectedCat == cat.id ? 'active' : ''}" data-cat="${cat.id}">
              ${cat.name}
            </button>
          `).join('')}
        </div>

        <!-- Menu Grid -->
        ${menuItems.length === 0 ? `
          <div style="text-align:center;padding:5rem 1rem;background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border-subtle);">
            <i class="ri-search-eye-line" style="font-size:3.5rem;color:var(--text-muted);display:block;margin-bottom:1rem;"></i>
            <h3 style="font-size:1.4rem;">No Dishes Found</h3>
            <p style="color:var(--text-secondary);margin-top:0.5rem;">Try adjusting your search criteria or category filter.</p>
            <button class="btn btn-outline btn-sm" id="reset-menu-filters" style="margin-top:1.5rem;">Reset Filters</button>
          </div>
        ` : `
          <div class="menu-grid">
            ${menuItems.map(item => `
              <div class="glass-card menu-card">
                <div class="menu-card-img-wrap">
                  <img src="${item.image}" alt="${item.name}" class="menu-card-img" />
                </div>
                <div class="menu-card-body">
                  <div class="menu-card-header">
                    <h3 class="menu-card-title">${item.name}</h3>
                    <span class="menu-card-price">$${item.price.toFixed(2)}</span>
                  </div>
                  <p class="menu-card-desc">${item.description}</p>
                  <div class="menu-card-footer">
                    <span style="font-size:0.8rem;color:var(--text-muted);"><i class="ri-fire-line text-gold"></i> Premium</span>
                    <button class="btn btn-primary btn-sm add-item-btn" data-id="${item.id}">
                      <i class="ri-add-line"></i> Customize & Add
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </main>
  `;
}

export function setupMenuPageEvents() {
  const searchInput = document.getElementById('menu-search-input');
  if (searchInput) {
    let timeout;
    searchInput.oninput = (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const query = e.target.value;
        const currentHash = window.location.hash.split('?')[0] || '#/menu';
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        if (query) urlParams.set('search', query);
        else urlParams.delete('search');
        window.location.hash = `${currentHash}?${urlParams.toString()}`;
      }, 300);
    };
  }

  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.onclick = () => {
      const catId = tab.dataset.cat;
      const currentHash = window.location.hash.split('?')[0] || '#/menu';
      const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      if (catId) urlParams.set('category', catId);
      else urlParams.delete('category');
      window.location.hash = `${currentHash}?${urlParams.toString()}`;
    };
  });

  const resetBtn = document.getElementById('reset-menu-filters');
  if (resetBtn) {
    resetBtn.onclick = () => {
      window.location.hash = '#/menu';
    };
  }

  document.querySelectorAll('.add-item-btn').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const item = await api.getMenu(id);
      if (item) openItemModal(item);
    };
  });
}
