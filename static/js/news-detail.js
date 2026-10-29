// SonaInfo News Detail Controller

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');

  if (!id) {
    window.location.href = '/news.html';
    return;
  }

  // Load article
  loadArticleDetails(id);
});

async function loadArticleDetails(id) {
  const loader = document.getElementById('detailLoader');
  const content = document.getElementById('detailContent');

  try {
    const res = await fetch(`/api/news/${id}`);
    const result = await res.json();

    if (loader) loader.classList.add('d-none');

    if (result.success && result.data) {
      if (content) content.classList.remove('d-none');

      const item = result.data;

      // Populate text details
      document.getElementById('articleTitle').innerText = item.title;
      document.getElementById('articleDescription').innerText = item.description;
      document.getElementById('articleCategory').innerText = item.category;
      document.getElementById('articleAuthor').innerText = item.authorName;
      document.getElementById('articleDate').innerText = formatDate(item.createdAt);

      // Featured Image
      const mainImg = document.getElementById('articleImage');
      if (mainImg) {
        mainImg.src = item.imageUrl || '/uploads/default-news.png';
        mainImg.onerror = () => {
          mainImg.src = 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&auto=format&fit=crop&q=60';
        };
      }

      // Event Box
      const eventBox = document.getElementById('eventBox');
      const eventDateRow = document.getElementById('eventDateRow');
      const eventLocationRow = document.getElementById('eventLocationRow');

      if (item.eventDate || item.location) {
        if (eventBox) eventBox.classList.remove('d-none');
        
        if (item.eventDate) {
          if (eventDateRow) eventDateRow.classList.remove('d-none');
          document.getElementById('articleEventDate').innerText = formatDate(item.eventDate);
        } else {
          if (eventDateRow) eventDateRow.classList.add('d-none');
        }

        if (item.location) {
          if (eventLocationRow) eventLocationRow.classList.remove('d-none');
          document.getElementById('articleLocation').innerText = item.location;
        } else {
          if (eventLocationRow) eventLocationRow.classList.add('d-none');
        }
      } else {
        if (eventBox) eventBox.classList.add('d-none');
      }

      // Source / Reference Box
      const sourceBox = document.getElementById('sourceBox');
      const sourceLink = document.getElementById('articleSource');
      if (item.source) {
        if (sourceBox) sourceBox.classList.remove('d-none');
        if (sourceLink) {
          sourceLink.innerText = item.source;
          // If source looks like a link, set href. Otherwise make it plain
          if (item.source.startsWith('http://') || item.source.startsWith('https://')) {
            sourceLink.href = item.source;
          } else {
            sourceLink.href = '#';
            sourceLink.removeAttribute('target');
          }
        }
      } else {
        if (sourceBox) sourceBox.classList.add('d-none');
      }

      // Render Apply button
      const applyBtnContainer = document.getElementById('applyBtnContainer');
      if (applyBtnContainer) {
        applyBtnContainer.innerHTML = renderApplyButton(item);
      }

      // Load Related news
      loadRelatedNewsGrid(result.related);
    } else {
      alert('Failed to load article. It might have been deleted.');
      window.location.href = '/news.html';
    }
  } catch (err) {
    console.error('Error fetching article:', err);
    if (loader) loader.classList.add('d-none');
  }
}

// Load Related News Sidebar
function loadRelatedNewsGrid(related) {
  const container = document.getElementById('relatedNewsContainer');
  if (!container) return;

  if (related && related.length > 0) {
    container.innerHTML = '';
    related.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card border-0 shadow-sm rounded-4 overflow-hidden bg-white';
      card.innerHTML = `
        <div style="height: 120px; overflow: hidden; background: #f1f5f9; position: relative;">
          <span class="badge bg-dark position-absolute small" style="top: 8px; left: 8px; z-index: 5; font-size: 0.65rem;">${item.category}</span>
          <img src="${item.imageUrl || '/uploads/default-news.png'}" class="w-100 h-100" style="object-fit: cover;" alt="${item.title}" onerror="this.src='https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&auto=format&fit=crop&q=60'">
        </div>
        <div class="p-3">
          <h6 class="fw-bold text-dark truncate mb-1" style="font-size: 0.9rem;" title="${item.title}">${item.title}</h6>
          <p class="text-muted small mb-2" style="font-size: 0.75rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 2.2rem;">${item.description}</p>
          <a href="/news-detail.html?id=${item.newsId || item._id}" class="small text-decoration-none fw-bold">Read Article <i class="bi bi-arrow-right"></i></a>
        </div>
      `;
      container.appendChild(card);
    });
  } else {
    container.innerHTML = '<p class="text-muted small">No related articles found.</p>';
  }
}
