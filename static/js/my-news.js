// SonaInfo My Submissions Controller

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || !user) {
    window.location.href = '/login.html';
    return;
  }

  // Load submissions
  loadSubmissions(token);
});

async function loadSubmissions(token) {
  const loader = document.getElementById('submissionsLoader');
  const empty = document.getElementById('submissionsEmpty');
  const tableWrapper = document.getElementById('submissionsTableWrapper');
  const tableBody = document.getElementById('submissionsTableBody');

  if (!tableBody) return;

  try {
    const response = await fetch('/api/news/my', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    if (loader) loader.classList.add('d-none');

    if (result.success && result.data.length > 0) {
      if (empty) empty.classList.add('d-none');
      if (tableWrapper) tableWrapper.classList.remove('d-none');
      
      tableBody.innerHTML = '';
      result.data.forEach(item => {
        const row = document.createElement('tr');
        
        // Status Badge selection
        let statusBadge = '';
        if (item.status === 'pending') {
          statusBadge = `<span class="badge bg-warning text-dark"><i class="bi bi-hourglass-split me-1"></i>Pending</span>`;
        } else if (item.status === 'approved') {
          statusBadge = `<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Approved</span>`;
        } else {
          statusBadge = `<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>Rejected</span>`;
        }

        row.innerHTML = `
          <td><strong class="text-dark d-block truncate" style="max-width: 320px;" title="${item.title}">${item.title}</strong></td>
          <td><span class="text-secondary small fw-semibold">${item.category}</span></td>
          <td class="small text-muted">${formatDate(item.createdAt)}</td>
          <td>${statusBadge}</td>
          <td class="text-center">
            <button class="btn btn-outline-primary btn-sm rounded-pill px-3 py-1" onclick="previewSubmission('${item.newsId || item._id}')">
              <i class="bi bi-eye me-1"></i> View
            </button>
          </td>
        `;
        tableBody.appendChild(row);
      });
      
      // Store globally for preview lookups
      window.mySubmissionsList = result.data;
    } else {
      if (empty) empty.classList.remove('d-none');
      if (tableWrapper) tableWrapper.classList.add('d-none');
    }
  } catch (err) {
    console.error('Error fetching submissions:', err);
    if (loader) loader.classList.add('d-none');
    if (empty) {
      empty.classList.remove('d-none');
      empty.querySelector('p').innerText = 'Failed to load submissions due to a server error.';
    }
  }
}

// Preview Submission in Modal
function previewSubmission(id) {
  const items = window.mySubmissionsList || [];
  const item = items.find(x => (x.newsId || x._id) === id);
  if (!item) return;

  document.getElementById('previewTitle').innerText = item.title;
  document.getElementById('previewDesc').innerText = item.description;
  document.getElementById('previewCategory').innerText = item.category;
  document.getElementById('previewEventDate').innerText = item.eventDate ? formatDate(item.eventDate) : 'N/A';
  document.getElementById('previewLocation').innerText = item.location || 'N/A';
  document.getElementById('previewSource').innerText = item.source || 'N/A';
  
  // Preview Image
  const previewImage = document.getElementById('previewImage');
  previewImage.src = item.imageUrl || '/uploads/default-news.png';
  previewImage.onerror = () => {
    previewImage.src = 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&auto=format&fit=crop&q=60';
  };

  // Status Badge in Modal
  const statusBadge = document.getElementById('previewStatusBadge');
  if (statusBadge) {
    statusBadge.innerText = item.status.toUpperCase();
    statusBadge.className = 'badge';
    if (item.status === 'pending') {
      statusBadge.classList.add('bg-warning', 'text-dark');
    } else if (item.status === 'approved') {
      statusBadge.classList.add('bg-success');
    } else {
      statusBadge.classList.add('bg-danger');
    }
  }

  // Show Modal
  const modal = new bootstrap.Modal(document.getElementById('previewModal'));
  modal.show();
}
