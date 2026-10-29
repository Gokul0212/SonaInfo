// SonaInfo Student Dashboard Controller

document.addEventListener('DOMContentLoaded', () => {
  // Validate authentication
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || !user) {
    window.location.href = '/login.html';
    return;
  }

  // Redirect admins to admin dashboard if they try to load student dashboard
  if (user.role === 'admin') {
    window.location.href = '/admin-dashboard.html';
    return;
  }

  // Initialize dashboard
  updateWelcomeGreeting(user);
  loadProfileModal(user);
  loadDashboardStats(token);
  loadDashboardNews();
});

// Update Welcome Greeting
function updateWelcomeGreeting(user) {
  const welcomeMsg = document.getElementById('welcomeMsg');
  if (!welcomeMsg) return;

  const hr = new Date().getHours();
  let timeGreeting = 'Good Evening';

  if (hr < 12) {
    timeGreeting = 'Good Morning';
  } else if (hr < 17) {
    timeGreeting = 'Good Afternoon';
  }

  welcomeMsg.innerHTML = `${timeGreeting}, <span>${user.name}</span>`;
}

// Load Profile Modal Details
function loadProfileModal(user) {
  document.getElementById('profileName').innerText = user.name;
  document.getElementById('profileEmail').innerText = user.email;
  document.getElementById('profileDept').innerText = user.department || 'Not Specified';
  document.getElementById('profileYear').innerText = user.year || 'Not Specified';
  document.getElementById('profileRole').innerText = user.role.toUpperCase();
  document.getElementById('profileStatus').innerText = user.status.toUpperCase();
}

// Load Dashboard Statistics
async function loadDashboardStats(token) {
  try {
    const res = await fetch('/api/news/my-stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await res.json();
    
    if (result.success) {
      const stats = result.data;
      document.getElementById('statPublishedNews').innerText = stats.publishedNews;
      document.getElementById('statMySubmissions').innerText = stats.mySubmissions;
      document.getElementById('statPending').innerText = stats.pending;
      document.getElementById('statApproved').innerText = stats.approved;
    }
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
  }
}

// Load 4 latest news cards for the dashboard
async function loadDashboardNews() {
  const grid = document.getElementById('dashNewsGrid');
  const loader = document.getElementById('dashNewsLoader');
  if (!grid) return;

  try {
    const res = await fetch('/api/news?limit=4');
    const result = await res.json();

    if (loader) loader.classList.add('d-none');

    if (result.success && result.data.length > 0) {
      grid.innerHTML = '';
      result.data.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-md-6';
        col.innerHTML = `
          <div class="news-card">
            <div class="news-img-wrapper">
              <span class="category-badge">${item.category}</span>
              <img src="${item.imageUrl || '/uploads/default-news.png'}" class="news-img" alt="${item.title}" onerror="this.src='https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&auto=format&fit=crop&q=60'">
            </div>
            <div class="news-body">
              <h5 class="news-title fs-6" title="${item.title}">${item.title}</h5>
              <p class="news-desc small" style="height: 3rem; -webkit-line-clamp: 2;">${item.description}</p>
              <div class="news-meta mt-2 pt-2">
                <span><i class="bi bi-person"></i> ${item.authorName}</span>
                <span><i class="bi bi-calendar"></i> ${formatDate(item.createdAt)}</span>
              </div>
              <div class="mt-3">
                <a href="/news-detail.html?id=${item.newsId || item._id}" class="btn btn-outline-primary btn-sm w-100 rounded-pill">Read More</a>
              </div>
            </div>
          </div>
        `;
        grid.appendChild(col);
      });
    } else {
      grid.innerHTML = `
        <div class="col-12 text-center py-5 bg-white border rounded-4 shadow-sm">
          <i class="bi bi-newspaper display-4 text-muted"></i>
          <h6 class="mt-3 fw-bold">No News Available</h6>
          <p class="text-muted small">Check back later for recent news posts!</p>
        </div>
      `;
    }
  } catch (err) {
    console.error('Error fetching dashboard news:', err);
    if (loader) loader.classList.add('d-none');
  }
}
