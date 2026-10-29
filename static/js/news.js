// SonaInfo News Feed Controller

let currentPage = 1;
const limit = 6;

document.addEventListener('DOMContentLoaded', () => {
  // Load categories into dropdown
  loadCategoriesOptions();

  // Check URL params
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('category');
  const searchParam = urlParams.get('search');
  const focusParam = urlParams.get('focus');

  if (catParam) {
    document.getElementById('categoryFilter').value = catParam;
  }
  if (searchParam) {
    document.getElementById('searchInput').value = searchParam;
  }

  if (focusParam === 'categories') {
    document.getElementById('categoriesFocusArea').classList.remove('d-none');
    loadCategoriesFocusGrid();
  }

  // Fetch news
  fetchNewsList(currentPage);

  // Form submit handler
  const filterForm = document.getElementById('filterForm');
  if (filterForm) {
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      currentPage = 1; // Reset to page 1 on new search
      fetchNewsList(currentPage);
    });
  }

  // Reset button handler
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetFilters();
    });
  }
});

// Fetch news list from API
async function fetchNewsList(page = 1) {
  const grid = document.getElementById('feedGrid');
  const loader = document.getElementById('feedLoader');
  const empty = document.getElementById('feedEmptyState');
  const paginationNav = document.getElementById('paginationNav');
  const feedTitle = document.getElementById('feedTitle');

  if (!grid) return;

  if (loader) loader.classList.remove('d-none');
  grid.innerHTML = '';
  if (empty) empty.classList.add('d-none');
  if (paginationNav) paginationNav.classList.add('d-none');

  const search = document.getElementById('searchInput').value.trim();
  const category = document.getElementById('categoryFilter').value;
  const sort = document.getElementById('sortFilter').value;

  try {
    const url = `/api/news?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&sort=${sort}`;
    const res = await fetch(url);
    const result = await res.json();

    if (loader) loader.classList.add('d-none');

    if (result.success && result.data.length > 0) {
      if (empty) empty.classList.add('d-none');
      if (paginationNav) paginationNav.classList.remove('d-none');

      // Update feed title text
      if (category) {
        feedTitle.innerText = `${category} Articles`;
      } else if (search) {
        feedTitle.innerText = `Search Results for "${search}"`;
      } else {
        feedTitle.innerText = 'All Articles';
      }

      // Populate Cards
      result.data.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        col.innerHTML = `
          <div class="news-card">
            <div class="news-img-wrapper">
              <span class="category-badge">${item.category}</span>
              <img src="${item.imageUrl || '/uploads/default-news.png'}" class="news-img" alt="${item.title}" onerror="this.src='https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&auto=format&fit=crop&q=60'">
            </div>
            <div class="news-body">
              <h5 class="news-title" title="${item.title}">${item.title}</h5>
              <p class="news-desc">${item.description}</p>
              <div class="news-meta">
                <span class="news-author"><i class="bi bi-person-circle"></i> ${item.authorName}</span>
                <span><i class="bi bi-calendar3"></i> ${formatDate(item.createdAt)}</span>
              </div>
              <div class="mt-3 d-flex flex-column gap-2">
                <a href="/news-detail.html?id=${item.newsId || item._id}" class="btn btn-outline-primary btn-sm w-100 rounded-pill">Read More</a>
                ${renderApplyButton(item)}
              </div>
            </div>
          </div>
        `;
        grid.appendChild(col);
      });

      // Build Pagination
      buildPaginationControls(result.pagination);
    } else {
      if (empty) empty.classList.remove('d-none');
    }
  } catch (err) {
    console.error('Error loading feed:', err);
    if (loader) loader.classList.add('d-none');
  }
}

// Build Pagination UI Controls
function buildPaginationControls(pag) {
  const pagList = document.getElementById('paginationList');
  if (!pagList) return;

  pagList.innerHTML = '';

  // Previous Button
  const prevLi = document.createElement('li');
  prevLi.className = `page-item ${pag.currentPage === 1 ? 'disabled' : ''}`;
  prevLi.innerHTML = `<a class="page-link" href="#" onclick="changeFeedPage(${pag.currentPage - 1})"><i class="bi bi-chevron-left"></i></a>`;
  pagList.appendChild(prevLi);

  // Page Numbers
  for (let i = 1; i <= pag.totalPages; i++) {
    const pageLi = document.createElement('li');
    pageLi.className = `page-item ${pag.currentPage === i ? 'active' : ''}`;
    pageLi.innerHTML = `<a class="page-link" href="#" onclick="changeFeedPage(${i})">${i}</a>`;
    pagList.appendChild(pageLi);
  }

  // Next Button
  const nextLi = document.createElement('li');
  nextLi.className = `page-item ${pag.currentPage === pag.totalPages ? 'disabled' : ''}`;
  nextLi.innerHTML = `<a class="page-link" href="#" onclick="changeFeedPage(${pag.currentPage + 1})"><i class="bi bi-chevron-right"></i></a>`;
  pagList.appendChild(nextLi);
}

// Handle Page Change Click
window.changeFeedPage = (page) => {
  event.preventDefault();
  currentPage = page;
  fetchNewsList(currentPage);
  window.scrollTo({ top: 300, behavior: 'smooth' });
};

// Reset Filters
window.resetFilters = () => {
  document.getElementById('searchInput').value = '';
  document.getElementById('categoryFilter').value = '';
  document.getElementById('sortFilter').value = 'newest';
  currentPage = 1;
  fetchNewsList(currentPage);
};

// Load categories list in dropdown
async function loadCategoriesOptions() {
  const filter = document.getElementById('categoryFilter');
  if (!filter) return;

  try {
    const res = await fetch('/api/categories');
    const result = await res.json();

    if (result.success && result.data.length > 0) {
      result.data.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.innerText = cat.name;
        filter.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Failed to load categories options:', err);
  }
}

// Load Categories Grid for Categories Focus Area
async function loadCategoriesFocusGrid() {
  const grid = document.getElementById('categoriesFocusGrid');
  if (!grid) return;

  try {
    const res = await fetch('/api/categories');
    const result = await res.json();

    if (result.success && result.data.length > 0) {
      grid.innerHTML = '';
      
      const colors = ['primary', 'warning', 'info', 'danger', 'success', 'dark'];
      result.data.forEach((cat, index) => {
        const color = colors[index % colors.length];
        const cardCol = document.createElement('div');
        cardCol.className = 'col-md-4 col-6';
        cardCol.innerHTML = `
          <div class="card border-0 shadow-sm p-3 rounded-4 bg-white hover-card cursor-pointer" onclick="browseCategory('${cat.name}')">
            <div class="d-flex align-items-center gap-2 mb-2">
              <span class="p-2 bg-${color} bg-opacity-10 text-${color} rounded-circle small"><i class="bi bi-tag-fill"></i></span>
              <h6 class="fw-bold mb-0 text-dark">${cat.name}</h6>
            </div>
            <small class="text-muted fw-semibold">${cat.count} Published Articles</small>
          </div>
        `;
        grid.appendChild(cardCol);
      });
    }
  } catch (err) {
    console.error('Failed to load categories focus grid:', err);
  }
}

// Category Badge Click Browse
window.browseCategory = (catName) => {
  document.getElementById('categoryFilter').value = catName;
  currentPage = 1;
  fetchNewsList(currentPage);
  // Hide categories focus area to clean page
  document.getElementById('categoriesFocusArea').classList.add('d-none');
};
