// Theme Controller (Day & Night)
function initTheme() {
  const savedTheme = localStorage.getItem('sonainfo_theme') || 'light';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-bs-theme', theme);
  if (document.body) {
    document.body.setAttribute('data-theme', theme);
    document.body.setAttribute('data-bs-theme', theme);
  }
  localStorage.setItem('sonainfo_theme', theme);
  updateThemeToggles(theme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

function updateThemeToggles(theme) {
  const toggleButtons = document.querySelectorAll('.theme-toggle-btn');
  toggleButtons.forEach(btn => {
    if (theme === 'dark') {
      btn.innerHTML = `<i class="bi bi-moon-stars-fill theme-icon-moon"></i> <span>Night</span>`;
      btn.setAttribute('title', 'Switch to Day Mode');
    } else {
      btn.innerHTML = `<i class="bi bi-sun-fill theme-icon-sun"></i> <span>Day</span>`;
      btn.setAttribute('title', 'Switch to Night Mode');
    }
  });

  const floatingBtn = document.getElementById('floatingThemeSwitch');
  if (floatingBtn) {
    if (theme === 'dark') {
      floatingBtn.innerHTML = `<i class="bi bi-moon-stars-fill theme-icon-moon fs-5"></i> <span>Night Mode</span>`;
      floatingBtn.setAttribute('title', 'Switch to Day (Light) Mode');
    } else {
      floatingBtn.innerHTML = `<i class="bi bi-sun-fill theme-icon-sun fs-5"></i> <span>Day Mode</span>`;
      floatingBtn.setAttribute('title', 'Switch to Night (Dark) Mode');
    }
  }
}

window.toggleTheme = toggleTheme;
window.applyTheme = applyTheme;
window.initTheme = initTheme;

// Execute immediately
initTheme();

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  // Check auth state for navbar display
  updateNavbarAuth();
  
  // Load news if on homepage
  if (document.getElementById('newsGrid')) {
    loadFeaturedNews();
  }
});

// Toast Notifications
function showSuccessToast(message) {
  const toastEl = document.getElementById('successToast');
  if (toastEl) {
    const msgEl = document.getElementById('successToastMsg');
    if (msgEl) msgEl.innerText = message;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
  }
}

function showErrorToast(message) {
  const toastEl = document.getElementById('errorToast');
  if (toastEl) {
    const msgEl = document.getElementById('errorToastMsg');
    if (msgEl) msgEl.innerText = message;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
  }
}

// Format Date Utility
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Update Navbar based on Auth State
function updateNavbarAuth() {
  const navAuthSection = document.getElementById('navAuthSection');
  if (!navAuthSection) return;

  const currentTheme = localStorage.getItem('sonainfo_theme') || 'light';
  const themeSwitchHtml = `
    <button class="theme-switch-btn theme-toggle-btn me-2" onclick="toggleTheme()" title="Switch Day/Night mode">
      ${currentTheme === 'dark' ? '<i class="bi bi-moon-stars-fill theme-icon-moon"></i> <span>Night</span>' : '<i class="bi bi-sun-fill theme-icon-sun"></i> <span>Day</span>'}
    </button>
  `;

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (token && user) {
    // Authenticated
    let dashboardLink = '/dashboard.html';
    let shareLink = '/share-news.html';
    
    if (user.role === 'admin') {
      dashboardLink = '/admin-dashboard.html';
      shareLink = '/admin-news.html?action=add'; // Admin add news
      
      navAuthSection.innerHTML = `
        ${themeSwitchHtml}
        <span class="text-light me-2 small d-none d-sm-inline">
          <i class="bi bi-shield-check text-warning me-1"></i><strong>${user.name}</strong>
        </span>
        <a href="${dashboardLink}" class="btn btn-warning btn-sm px-3 rounded-pill text-dark fw-bold me-2">Admin Panel</a>
        <button onclick="handleLogout()" class="btn btn-outline-light btn-sm px-3 rounded-pill">Logout</button>
      `;
    } else {
      navAuthSection.innerHTML = `
        ${themeSwitchHtml}
        <span class="text-light me-2 small d-none d-sm-inline">
          Hello, <strong>${user.name}</strong>
        </span>
        <a href="${dashboardLink}" class="btn btn-outline-light btn-sm px-3 rounded-pill me-2">Dashboard</a>
        <a href="${shareLink}" class="btn btn-glitter-glow btn-sm px-3 text-dark rounded-pill me-2">
          <i class="bi bi-stars"></i><span>Share News</span>
        </a>
        <button onclick="handleLogout()" class="btn btn-outline-light btn-sm px-3 rounded-pill">Logout</button>
      `;
    }
  } else {
    // Unauthenticated (Guest)
    navAuthSection.innerHTML = `
      ${themeSwitchHtml}
      <a href="/login.html" class="btn btn-outline-light btn-sm px-3 rounded-pill"><i class="bi bi-person-circle me-1"></i>Login</a>
      <a href="/register.html" class="btn btn-glitter-glow btn-sm px-3 text-dark rounded-pill"><i class="bi bi-stars"></i><span>Register</span></a>
      <a href="/login.html?role=admin" class="btn btn-outline-warning btn-sm px-3 rounded-pill"><i class="bi bi-shield-lock-fill me-1"></i>Admin</a>
    `;
  }
}

// Handle Logout
function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showSuccessToast('Logged out successfully.');
  setTimeout(() => {
    window.location.href = '/';
  }, 1000);
}

// Load Featured News on Homepage
async function loadFeaturedNews() {
  const newsGrid = document.getElementById('newsGrid');
  const newsLoader = document.getElementById('newsLoader');
  const newsEmptyState = document.getElementById('newsEmptyState');

  try {
    const res = await fetch('/api/news?limit=6');
    const data = await res.json();

    if (newsLoader) newsLoader.classList.add('d-none');

    if (data.success && data.data.length > 0) {
      if (newsEmptyState) newsEmptyState.classList.add('d-none');
      newsGrid.innerHTML = '';
      
      data.data.forEach(item => {
        const cardCol = document.createElement('div');
        cardCol.className = 'col-md-6 col-lg-4';
        cardCol.innerHTML = `
          <div class="news-card">
            <div class="news-img-wrapper">
              <span class="category-badge">${item.category}</span>
              <img src="${item.imageUrl || '/uploads/default-news.png'}" class="news-img" alt="${item.title}" onerror="this.src='https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&auto=format&fit=crop&q=60'">
            </div>
            <div class="news-body">
              <h5 class="news-title" title="${item.title}">${item.title}</h5>
              <p class="news-desc">${item.description}</p>
              <div class="news-meta">
                <span class="news-author">
                  <i class="bi bi-person-circle"></i> ${item.authorName}
                </span>
                <span>
                  <i class="bi bi-calendar3 me-1"></i> ${formatDate(item.createdAt)}
                </span>
              </div>
              <div class="mt-3 d-flex flex-column gap-2">
                <a href="/news-detail.html?id=${item.newsId || item._id}" class="btn btn-outline-primary btn-sm w-100 rounded-pill">Read More</a>
                ${renderApplyButton(item)}
              </div>
            </div>
          </div>
        `;
        newsGrid.appendChild(cardCol);
      });
    } else {
      if (newsEmptyState) newsEmptyState.classList.remove('d-none');
    }
  } catch (error) {
    console.error('Error loading news:', error);
    if (newsLoader) newsLoader.classList.add('d-none');
    if (newsEmptyState) {
      newsEmptyState.classList.remove('d-none');
      newsEmptyState.querySelector('p').innerText = 'Failed to load news. Ensure MongoDB is running and server is started.';
    }
  }
}

// Apply Button Helper
function renderApplyButton(item) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (item.category === 'Placements' || item.category === 'Internships') {
    if (user) {
      if (user.role === 'user') {
        return `<button class="btn btn-warning btn-sm w-100 rounded-pill fw-bold text-dark" onclick="event.preventDefault(); triggerApply('${item.newsId || item._id}', '${item.title.replace(/'/g, "\\'")}')"><i class="bi bi-send-plus-fill me-1"></i> Apply Now</button>`;
      }
      return ''; // Admin
    } else {
      return `<a href="/login.html" class="btn btn-outline-warning btn-sm w-100 rounded-pill"><i class="bi bi-lock me-1"></i> Login to Apply</a>`;
    }
  }
  return '';
}

// Global verification modal triggers
window.triggerApply = (newsId, newsTitle) => {
  let existing = document.getElementById('sonaApplyModal');
  if (existing) existing.remove();

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) {
    showErrorToast('Please login as a student to apply.');
    return;
  }

  const modalHTML = `
  <div class="modal fade" id="sonaApplyModal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg" style="border-radius: 20px;">
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title fw-bold text-dark"><i class="bi bi-briefcase text-primary me-2"></i>Apply for Position</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" id="applyModalCloseBtn"></button>
        </div>
        <div class="modal-body py-4">
          <div id="applyStep1">
            <h6 class="fw-bold text-dark mb-1" id="applyNewsTitle">${newsTitle}</h6>
            <p class="text-muted small mb-4">Please verify your details below to apply:</p>
            
            <div class="mb-3 bg-light rounded-3 p-3 small text-start">
              <div class="mb-2"><strong>Name:</strong> ${user.name}</div>
              <div class="mb-2"><strong>Department:</strong> ${user.department || 'N/A'}</div>
              <div class="mb-0"><strong>Gmail Address:</strong> ${user.email}</div>
            </div>

            <div class="alert alert-danger d-none mb-3 small" id="applyErrorAlert"></div>

            <button onclick="sendApplicationCode('${newsId}')" class="btn btn-primary-custom w-100 py-2.5 fw-bold text-dark rounded-3 d-flex align-items-center justify-content-center gap-2" id="sendCodeBtn">
              <span>Send Verification Code to Gmail</span>
              <div class="spinner-border spinner-border-sm d-none" id="applySpinner1" role="status"></div>
            </button>
          </div>

          <div id="applyStep2" class="d-none">
            <div class="text-center mb-4">
              <i class="bi bi-envelope-open text-warning display-5 mb-2 d-inline-block"></i>
              <h6 class="fw-bold text-dark">Verification Code Sent</h6>
              <p class="text-muted small">We have simulated sending a 6-digit code to <strong>${user.email}</strong>. Enter it below to verify.</p>
            </div>

            <div class="mb-3">
              <input type="text" class="form-control text-center fs-4 fw-bold bg-light" id="verificationCodeInput" placeholder="000000" maxlength="6">
            </div>

            <!-- Mock inbox visual -->
            <div class="alert alert-warning text-center py-2 px-3 rounded-3 small mb-3 text-dark" id="mockEmailBanner">
              <i class="bi bi-info-circle me-1"></i> [GMAIL SIMULATION] Code: <strong id="mockVerifyCode" class="fs-5 text-danger">000000</strong>
            </div>

            <div class="alert alert-danger d-none mb-3 small" id="verifyErrorAlert"></div>

            <button onclick="submitVerifyCode()" class="btn btn-success w-100 py-2.5 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2" id="verifySubmitBtn">
              <span>Confirm & Verify Application</span>
              <div class="spinner-border spinner-border-sm d-none" id="applySpinner2" role="status"></div>
            </button>
          </div>

          <div id="applyStep3" class="d-none text-center py-3">
            <i class="bi bi-patch-check-fill text-success display-2 mb-3 d-inline-block"></i>
            <h4 class="fw-bold text-dark">Application Verified!</h4>
            <p class="text-muted small px-3">Your profile has been successfully verified and sent to the placement cell.</p>
            <button class="btn btn-primary-custom text-dark rounded-pill px-4" data-bs-dismiss="modal">Done</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  const modal = new bootstrap.Modal(document.getElementById('sonaApplyModal'));
  modal.show();
};

window.sendApplicationCode = async (newsId) => {
  const token = localStorage.getItem('token');
  const sendCodeBtn = document.getElementById('sendCodeBtn');
  const spinner = document.getElementById('applySpinner1');
  const errorAlert = document.getElementById('applyErrorAlert');

  if (errorAlert) errorAlert.classList.add('d-none');
  if (spinner) spinner.classList.remove('d-none');
  if (sendCodeBtn) sendCodeBtn.disabled = true;

  try {
    const res = await fetch(`/api/applications/apply/${newsId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await res.json();
    if (spinner) spinner.classList.add('d-none');

    if (result.success) {
      document.getElementById('applyStep1').classList.add('d-none');
      document.getElementById('applyStep2').classList.remove('d-none');
      
      window.activeApplicationId = result.data.applicationId;
      document.getElementById('mockVerifyCode').innerText = result.data.code;
    } else {
      if (errorAlert) {
        errorAlert.innerText = result.message || 'Failed to initialize application.';
        errorAlert.classList.remove('d-none');
      }
      if (sendCodeBtn) sendCodeBtn.disabled = false;
    }
  } catch (err) {
    console.error('Send code error:', err);
    if (spinner) spinner.classList.add('d-none');
    if (sendCodeBtn) sendCodeBtn.disabled = false;
  }
};

window.submitVerifyCode = async () => {
  const token = localStorage.getItem('token');
  const code = document.getElementById('verificationCodeInput').value.trim();
  const verifySubmitBtn = document.getElementById('verifySubmitBtn');
  const spinner = document.getElementById('applySpinner2');
  const errorAlert = document.getElementById('verifyErrorAlert');

  if (!code) {
    alert('Please enter the 6-digit verification code.');
    return;
  }

  if (errorAlert) errorAlert.classList.add('d-none');
  if (spinner) spinner.classList.remove('d-none');
  if (verifySubmitBtn) verifySubmitBtn.disabled = true;

  try {
    const res = await fetch(`/api/applications/verify/${window.activeApplicationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ code })
    });
    const result = await res.json();
    if (spinner) spinner.classList.add('d-none');

    if (result.success) {
      document.getElementById('applyStep2').classList.add('d-none');
      document.getElementById('applyStep3').classList.remove('d-none');
      showSuccessToast('Application verified successfully!');
    } else {
      if (errorAlert) {
        errorAlert.innerText = result.message || 'Incorrect verification code.';
        errorAlert.classList.remove('d-none');
      }
      if (verifySubmitBtn) verifySubmitBtn.disabled = false;
    }
  } catch (err) {
    console.error('Verify code error:', err);
    if (spinner) spinner.classList.add('d-none');
    if (verifySubmitBtn) verifySubmitBtn.disabled = false;
  }
};
