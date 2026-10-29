// SonaInfo Admin Controller

// Theme Controller for Admin
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
    } else {
      floatingBtn.innerHTML = `<i class="bi bi-sun-fill theme-icon-sun fs-5"></i> <span>Day Mode</span>`;
    }
  }
}

window.toggleTheme = toggleTheme;
window.applyTheme = applyTheme;
window.initTheme = initTheme;

initTheme();

let activeDeleteId = null;
let activeDeleteType = null; // 'news' or 'user' or 'category'

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  // Verify Admin Authentication
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || !user || user.role !== 'admin') {
    window.location.href = '/login.html';
    return;
  }

  // Identify active page and execute corresponding loader
  const pathname = window.location.pathname;

  if (document.getElementById('adminStatUsers')) {
    loadAdminStats(token);
  }

  if (document.getElementById('pendingTableBody')) {
    loadPendingSubmissions(token);
  }

  if (document.getElementById('newsTableBody')) {
    loadAllNews(token);
    loadCategoriesDropdown();
    
    // Check if redirect wants to open add news modal
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'add') {
      setTimeout(openAddNewsModal, 500);
    }
  }

  if (document.getElementById('usersTableBody')) {
    loadAllUsers(token);
  }

  if (document.getElementById('catTableBody')) {
    loadAllCategories(token);
  }

  if (document.getElementById('appsTableBody')) {
    loadAllApplications(token);
  }

  // Manage News Image URL live preview
  const formImageUrl = document.getElementById('formImageUrl');
  const formImagePreview = document.getElementById('formImagePreview');
  if (formImageUrl && formImagePreview) {
    formImageUrl.addEventListener('input', () => {
      const url = formImageUrl.value.trim();
      formImagePreview.src = url || '/uploads/default-news.png';
    });
    formImagePreview.addEventListener('error', () => {
      formImagePreview.src = 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&auto=format&fit=crop&q=60';
    });
  }

  // Handle news editor form submission (Add / Edit)
  const newsEditorForm = document.getElementById('newsEditorForm');
  if (newsEditorForm) {
    newsEditorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('editArticleId').value;
      const title = document.getElementById('formNewsTitle').value.trim();
      const category = document.getElementById('formNewsCategory').value;
      const status = document.getElementById('formNewsStatus').value;
      const eventDate = document.getElementById('formEventDate').value;
      const location = document.getElementById('formLocation').value.trim();
      const source = document.getElementById('formSource').value.trim();
      const imageUrl = document.getElementById('formImageUrl').value.trim();
      const description = document.getElementById('formDescription').value.trim();

      const payload = {
        title,
        category,
        status,
        eventDate: eventDate || undefined,
        location: location || undefined,
        source: source || undefined,
        imageUrl: imageUrl || undefined,
        description
      };

      try {
        let endpoint = '/api/news';
        let method = 'POST';

        if (id) {
          endpoint = `/api/news/${id}`;
          method = 'PUT';
        }

        const res = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (result.success) {
          const modal = bootstrap.Modal.getInstance(document.getElementById('newsFormModal'));
          if (modal) modal.hide();
          
          showSuccessToast(id ? 'Changes saved successfully.' : 'News published successfully.');
          loadAllNews(token);
        } else {
          alert(result.message || 'Saving failed.');
        }
      } catch (err) {
        console.error('Error saving news:', err);
      }
    });
  }

  // Handle Category form submission (Add / Edit)
  const catForm = document.getElementById('catForm');
  if (catForm) {
    catForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('editCategoryId').value;
      const name = document.getElementById('catName').value.trim();
      const description = document.getElementById('catDesc').value.trim();

      try {
        let endpoint = '/api/categories';
        let method = 'POST';

        if (id) {
          endpoint = `/api/categories/${id}`;
          method = 'PUT';
        }

        const res = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name, description })
        });

        const result = await res.json();
        if (result.success) {
          showSuccessToast(id ? 'Category updated successfully.' : 'Category added successfully.');
          resetCatForm();
          loadAllCategories(token);
        } else {
          showErrorToast(result.message || 'Operation failed.');
        }
      } catch (err) {
        console.error('Category submit error:', err);
        showErrorToast('Failed to save category.');
      }
    });
  }

  // Confirm delete handler for News
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (!activeDeleteId) return;
      try {
        const res = await fetch(`/api/news/${activeDeleteId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        if (modal) modal.hide();

        if (result.success) {
          showSuccessToast('News article deleted successfully.');
          if (document.getElementById('pendingTableBody')) {
            loadPendingSubmissions(token);
          } else {
            loadAllNews(token);
          }
        } else {
          showErrorToast(result.message || 'Deletion failed.');
        }
      } catch (err) {
        console.error('Delete error:', err);
      }
    });
  }

  // Confirm delete handler for User
  const confirmDeleteUserBtn = document.getElementById('confirmDeleteUserBtn');
  if (confirmDeleteUserBtn) {
    confirmDeleteUserBtn.addEventListener('click', async () => {
      if (!activeDeleteId) return;
      try {
        const res = await fetch(`/api/users/${activeDeleteId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteUserConfirmModal'));
        if (modal) modal.hide();

        if (result.success) {
          showSuccessToast('User account deleted successfully.');
          loadAllUsers(token);
        } else {
          showErrorToast(result.message || 'Deletion failed.');
        }
      } catch (err) {
        console.error('Delete user error:', err);
      }
    });
  }

  // Confirm delete handler for Category
  const confirmDeleteCatBtn = document.getElementById('confirmDeleteCatBtn');
  if (confirmDeleteCatBtn) {
    confirmDeleteCatBtn.addEventListener('click', async () => {
      if (!activeDeleteId) return;
      try {
        const res = await fetch(`/api/categories/${activeDeleteId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteCatConfirmModal'));
        if (modal) modal.hide();

        if (result.success) {
          showSuccessToast('Category deleted successfully.');
          loadAllCategories(token);
        } else {
          showErrorToast(result.message || 'Deletion failed.');
        }
      } catch (err) {
        console.error('Delete category error:', err);
      }
    });
  }
});

// Load admin stats
async function loadAdminStats(token) {
  try {
    const res = await fetch('/api/news/admin-stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success) {
      const stats = result.data;
      document.getElementById('adminStatUsers').innerText = stats.totalUsers;
      document.getElementById('adminStatNews').innerText = stats.totalNews;
      document.getElementById('adminStatPending').innerText = stats.pendingReview;
      document.getElementById('adminStatPublished').innerText = stats.published;
      document.getElementById('adminStatRejected').innerText = stats.rejected;
    }
  } catch (err) {
    console.error('Error fetching admin stats:', err);
  }
}

// Load pending news submissions
async function loadPendingSubmissions(token) {
  const tableBody = document.getElementById('pendingTableBody');
  const loader = document.getElementById('pendingLoader');
  const empty = document.getElementById('pendingEmpty');
  const tableWrapper = document.getElementById('pendingTableWrapper');

  if (!tableBody) return;

  try {
    const res = await fetch('/api/news/pending', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (loader) loader.classList.add('d-none');

    if (result.success && result.data.length > 0) {
      if (empty) empty.classList.add('d-none');
      if (tableWrapper) tableWrapper.classList.remove('d-none');

      tableBody.innerHTML = '';
      result.data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><img src="${item.imageUrl || '/uploads/default-news.png'}" class="rounded border" style="width: 50px; height: 35px; object-fit: cover;"></td>
          <td><strong class="text-dark truncate d-block" style="max-width: 250px;">${item.title}</strong></td>
          <td><span class="small">${item.authorName}</span></td>
          <td><span class="badge bg-secondary">${item.category}</span></td>
          <td class="small text-muted">${formatDate(item.createdAt)}</td>
          <td class="text-center">
            <button class="btn btn-primary btn-sm rounded-pill px-2 py-0.5" onclick="viewPendingReview('${item.newsId || item._id}')"><i class="bi bi-eye"></i> View</button>
            <button class="btn btn-success btn-sm rounded-pill px-2 py-0.5 ms-1" onclick="approveSubmission('${item.newsId || item._id}')"><i class="bi bi-check2"></i> Approve</button>
            <button class="btn btn-warning btn-sm rounded-pill px-2 py-0.5 ms-1" onclick="rejectSubmission('${item.newsId || item._id}')"><i class="bi bi-x"></i> Reject</button>
            <button class="btn btn-danger btn-sm rounded-pill px-2 py-0.5 ms-1" onclick="triggerDeleteNews('${item.newsId || item._id}')"><i class="bi bi-trash"></i></button>
          </td>
        `;
        tableBody.appendChild(row);
      });
      window.pendingSubmissions = result.data;
    } else {
      if (empty) empty.classList.remove('d-none');
      if (tableWrapper) tableWrapper.classList.add('d-none');
    }
  } catch (err) {
    console.error('Error fetching pending submissions:', err);
    if (loader) loader.classList.add('d-none');
  }
}

// View pending details in modal
window.viewPendingReview = (id) => {
  const items = window.pendingSubmissions || [];
  const item = items.find(x => (x.newsId || x._id) === id);
  if (!item) return;

  document.getElementById('reviewTitle').innerText = item.title;
  document.getElementById('reviewDesc').innerText = item.description;
  document.getElementById('reviewCategory').innerText = item.category;
  document.getElementById('reviewAuthor').innerText = item.authorName;
  document.getElementById('reviewEventDate').innerText = item.eventDate ? formatDate(item.eventDate) : 'N/A';
  document.getElementById('reviewLocation').innerText = item.location || 'N/A';
  document.getElementById('reviewSource').innerText = item.source || 'N/A';

  const previewImage = document.getElementById('reviewImage');
  previewImage.src = item.imageUrl || '/uploads/default-news.png';

  const footer = document.getElementById('reviewModalFooter');
  footer.innerHTML = `
    <button type="button" class="btn btn-success rounded-pill px-4" onclick="approveSubmission('${item.newsId || item._id}', true)"><i class="bi bi-check2"></i> Approve</button>
    <button type="button" class="btn btn-warning rounded-pill px-4" onclick="rejectSubmission('${item.newsId || item._id}', true)"><i class="bi bi-x"></i> Reject</button>
    <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Close</button>
  `;

  const modal = new bootstrap.Modal(document.getElementById('reviewModal'));
  modal.show();
};

// Approve Submission
window.approveSubmission = async (id, isFromModal = false) => {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/api/news/${id}/approve`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success) {
      showSuccessToast('Submission approved and published.');
      if (isFromModal) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
        if (modal) modal.hide();
      }
      loadPendingSubmissions(token);
    }
  } catch (err) {
    console.error('Approve error:', err);
  }
};

// Reject Submission
window.rejectSubmission = async (id, isFromModal = false) => {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/api/news/${id}/reject`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success) {
      showSuccessToast('Submission rejected.');
      if (isFromModal) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
        if (modal) modal.hide();
      }
      loadPendingSubmissions(token);
    }
  } catch (err) {
    console.error('Reject error:', err);
  }
};

// Load all news (Admin News list)
async function loadAllNews(token) {
  const tableBody = document.getElementById('newsTableBody');
  const loader = document.getElementById('newsLoader');
  const empty = document.getElementById('newsEmpty');
  const tableWrapper = document.getElementById('newsTableWrapper');

  if (!tableBody) return;

  try {
    const res = await fetch('/api/news/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (loader) loader.classList.add('d-none');

    if (result.success && result.data.length > 0) {
      if (empty) empty.classList.add('d-none');
      if (tableWrapper) tableWrapper.classList.remove('d-none');

      tableBody.innerHTML = '';
      result.data.forEach(item => {
        const row = document.createElement('tr');
        
        let statusBadge = '';
        if (item.status === 'pending') {
          statusBadge = `<span class="badge bg-warning text-dark">Pending</span>`;
        } else if (item.status === 'approved') {
          statusBadge = `<span class="badge bg-success">Published</span>`;
        } else {
          statusBadge = `<span class="badge bg-danger">Rejected</span>`;
        }

        row.innerHTML = `
          <td><img src="${item.imageUrl || '/uploads/default-news.png'}" class="rounded border" style="width: 50px; height: 35px; object-fit: cover;"></td>
          <td><strong class="text-dark truncate d-block" style="max-width: 250px;" title="${item.title}">${item.title}</strong></td>
          <td><span class="small">${item.category}</span></td>
          <td><span class="small">${item.authorName}</span></td>
          <td class="small text-muted">${formatDate(item.createdAt)}</td>
          <td>${statusBadge}</td>
          <td class="text-center">
            <button class="btn btn-outline-primary btn-sm rounded-pill px-2 py-0.5" onclick="viewNewsDetail('${item.newsId || item._id}')"><i class="bi bi-eye"></i></button>
            <button class="btn btn-success btn-sm rounded-pill px-2 py-0.5 ms-1" onclick="openEditNewsModal('${item.newsId || item._id}')"><i class="bi bi-pencil"></i> Edit</button>
            <button class="btn btn-danger btn-sm rounded-pill px-2 py-0.5 ms-1" onclick="triggerDeleteNews('${item.newsId || item._id}')"><i class="bi bi-trash"></i></button>
          </td>
        `;
        tableBody.appendChild(row);
      });
      window.allNewsList = result.data;
    } else {
      if (empty) empty.classList.remove('d-none');
      if (tableWrapper) tableWrapper.classList.add('d-none');
    }
  } catch (err) {
    console.error('Error fetching all news:', err);
    if (loader) loader.classList.add('d-none');
  }
}

// Direct view page redirect
window.viewNewsDetail = (id) => {
  window.location.href = `/news-detail.html?id=${id}`;
};

// Open Add News Modal
window.openAddNewsModal = () => {
  document.getElementById('newsFormModalLabel').innerText = 'Add News Article';
  document.getElementById('editArticleId').value = '';
  document.getElementById('newsEditorForm').reset();
  document.getElementById('formNewsStatus').value = 'approved';
  document.getElementById('formImagePreview').src = '/uploads/default-news.png';
  document.getElementById('saveNewsBtn').innerText = 'Publish News';

  const modal = new bootstrap.Modal(document.getElementById('newsFormModal'));
  modal.show();
};

// Open Edit News Modal
window.openEditNewsModal = (id) => {
  const items = window.allNewsList || [];
  const item = items.find(x => (x.newsId || x._id) === id);
  if (!item) return;

  document.getElementById('newsFormModalLabel').innerText = 'Edit News Article';
  document.getElementById('editArticleId').value = item.newsId || item._id;
  document.getElementById('formNewsTitle').value = item.title;
  document.getElementById('formNewsCategory').value = item.category;
  document.getElementById('formNewsStatus').value = item.status;
  document.getElementById('formEventDate').value = item.eventDate ? item.eventDate.substring(0, 10) : '';
  document.getElementById('formLocation').value = item.location || '';
  document.getElementById('formSource').value = item.source || '';
  document.getElementById('formImageUrl').value = item.imageUrl || '';
  document.getElementById('formDescription').value = item.description;

  document.getElementById('formImagePreview').src = item.imageUrl || '/uploads/default-news.png';
  document.getElementById('saveNewsBtn').innerText = 'Save Changes';

  const modal = new bootstrap.Modal(document.getElementById('newsFormModal'));
  modal.show();
};

// Trigger delete news confirm
window.triggerDeleteNews = (id) => {
  activeDeleteId = id;
  const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
  modal.show();
};

// Load categories dropdown inside form
async function loadCategoriesDropdown() {
  const dropdown = document.getElementById('formNewsCategory');
  if (!dropdown) return;

  try {
    const res = await fetch('/api/categories');
    const result = await res.json();
    if (result.success && result.data.length > 0) {
      dropdown.innerHTML = '';
      result.data.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.innerText = cat.name;
        dropdown.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Failed to load categories dropdown:', err);
  }
}

// Load all users (Admin User Management)
async function loadAllUsers(token) {
  const tableBody = document.getElementById('usersTableBody');
  const loader = document.getElementById('usersLoader');
  const empty = document.getElementById('usersEmpty');
  const tableWrapper = document.getElementById('usersTableWrapper');

  if (!tableBody) return;

  try {
    const res = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (loader) loader.classList.add('d-none');

    if (result.success && result.data.length > 0) {
      if (empty) empty.classList.add('d-none');
      if (tableWrapper) tableWrapper.classList.remove('d-none');

      tableBody.innerHTML = '';
      result.data.forEach(u => {
        const row = document.createElement('tr');
        
        let statusBadge = u.status === 'active' 
          ? `<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Active</span>`
          : `<span class="badge bg-secondary"><i class="bi bi-dash-circle me-1"></i>Disabled</span>`;

        let roleBadge = u.role === 'admin'
          ? `<span class="badge bg-warning text-dark"><i class="bi bi-shield-check"></i> Admin</span>`
          : `<span class="badge bg-primary">Student</span>`;

        row.innerHTML = `
          <td><strong class="text-dark">${u.name}</strong></td>
          <td><span class="small text-secondary">${u.email}</span></td>
          <td><span class="small">${u.department || 'N/A'}</span></td>
          <td><span class="small">${u.year || 'N/A'}</span></td>
          <td>${roleBadge}</td>
          <td>${statusBadge}</td>
          <td class="text-center">
            <button class="btn btn-${u.status === 'active' ? 'outline-secondary' : 'success'} btn-sm rounded-pill px-3 py-0.5" onclick="toggleUserStatus('${u.userId}')">
              <i class="bi bi-${u.status === 'active' ? 'slash-circle' : 'check2-circle'}"></i> ${u.status === 'active' ? 'Disable' : 'Enable'}
            </button>
            <button class="btn btn-danger btn-sm rounded-pill px-2 py-0.5 ms-1" onclick="triggerDeleteUser('${u.userId}')"><i class="bi bi-trash"></i></button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    } else {
      if (empty) empty.classList.remove('d-none');
      if (tableWrapper) tableWrapper.classList.add('d-none');
    }
  } catch (err) {
    console.error('Error fetching users:', err);
    if (loader) loader.classList.add('d-none');
  }
}

// Toggle user Active / Disabled status
window.toggleUserStatus = async (id) => {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/api/users/${id}/status`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success) {
      showSuccessToast(result.message);
      loadAllUsers(token);
    } else {
      showErrorToast(result.message || 'Operation failed.');
    }
  } catch (err) {
    console.error('Toggle status error:', err);
  }
};

// Trigger delete user confirm
window.triggerDeleteUser = (id) => {
  activeDeleteId = id;
  const modal = new bootstrap.Modal(document.getElementById('deleteUserConfirmModal'));
  modal.show();
};

// Load all categories (Admin Category Management)
async function loadAllCategories(token) {
  const tableBody = document.getElementById('catTableBody');
  const loader = document.getElementById('catLoader');
  const empty = document.getElementById('catEmpty');
  const tableWrapper = document.getElementById('catTableWrapper');

  if (!tableBody) return;

  try {
    const res = await fetch('/api/categories');
    const result = await res.json();
    if (loader) loader.classList.add('d-none');

    if (result.success && result.data.length > 0) {
      if (empty) empty.classList.add('d-none');
      if (tableWrapper) tableWrapper.classList.remove('d-none');

      tableBody.innerHTML = '';
      result.data.forEach(cat => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong class="text-dark">${cat.name}</strong></td>
          <td><span class="small text-secondary">${cat.description || 'N/A'}</span></td>
          <td><span class="badge bg-light text-dark border fw-bold px-2.5 py-1.5"><i class="bi bi-newspaper me-1"></i> ${cat.count} articles</span></td>
          <td class="text-center">
            <button class="btn btn-outline-primary btn-sm rounded-pill px-2.5 py-0.5" onclick="editCategory('${cat.categoryId}', '${cat.name}', '${cat.description}')"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-danger btn-sm rounded-pill px-2.5 py-0.5 ms-1" onclick="triggerDeleteCategory('${cat.categoryId}')"><i class="bi bi-trash"></i></button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    } else {
      if (empty) empty.classList.remove('d-none');
      if (tableWrapper) tableWrapper.classList.add('d-none');
    }
  } catch (err) {
    console.error('Error fetching categories:', err);
    if (loader) loader.classList.add('d-none');
  }
}

// Edit Category pre-fill form
window.editCategory = (id, name, desc) => {
  document.getElementById('editCategoryId').value = id;
  document.getElementById('catName').value = name;
  document.getElementById('catDesc').value = desc === 'N/A' ? '' : desc;
  document.getElementById('catFormTitle').innerText = 'Edit Category';
  document.getElementById('catSubmitBtn').innerText = 'Save Changes';
  document.getElementById('catSubmitBtn').className = 'btn btn-primary w-100 py-2 fw-bold rounded-3 mt-2';
  document.getElementById('catCancelBtn').classList.remove('d-none');
};

// Reset Category Form
window.resetCatForm = () => {
  document.getElementById('editCategoryId').value = '';
  document.getElementById('catForm').reset();
  document.getElementById('catFormTitle').innerText = 'Add New Category';
  document.getElementById('catSubmitBtn').innerText = 'Add Category';
  document.getElementById('catSubmitBtn').className = 'btn btn-success w-100 py-2 fw-bold rounded-3 mt-2';
  document.getElementById('catCancelBtn').classList.add('d-none');
};

// Trigger delete category confirm
window.triggerDeleteCategory = (id) => {
  activeDeleteId = id;
  const modal = new bootstrap.Modal(document.getElementById('deleteCatConfirmModal'));
  modal.show();
};

// Load all verified student applications
async function loadAllApplications(token) {
  const tableBody = document.getElementById('appsTableBody');
  const loader = document.getElementById('appsLoader');
  const empty = document.getElementById('appsEmpty');
  const tableWrapper = document.getElementById('appsTableWrapper');

  if (!tableBody) return;

  try {
    const res = await fetch('/api/applications/admin/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (loader) loader.classList.add('d-none');

    if (result.success && result.data.length > 0) {
      if (empty) empty.classList.add('d-none');
      if (tableWrapper) tableWrapper.classList.remove('d-none');

      tableBody.innerHTML = '';
      result.data.forEach(app => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong class="text-dark">${app.newsTitle}</strong></td>
          <td><span class="small fw-semibold text-primary">${app.studentName}</span></td>
          <td><span class="small text-muted">${app.studentEmail}</span></td>
          <td class="small text-muted">${formatDate(app.createdAt)}</td>
          <td><span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Verified</span></td>
        `;
        tableBody.appendChild(row);
      });
    } else {
      if (empty) empty.classList.remove('d-none');
      if (tableWrapper) tableWrapper.classList.add('d-none');
    }
  } catch (err) {
    console.error('Error fetching applications:', err);
    if (loader) loader.classList.add('d-none');
  }
}
