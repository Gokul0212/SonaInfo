// SonaInfo Share News Controller

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || !user) {
    window.location.href = '/login.html';
    return;
  }

  // Load categories
  loadCategoriesSelect();

  // Manage Image URL live preview
  const imageUrlInput = document.getElementById('imageUrl');
  const imagePreview = document.getElementById('imagePreview');

  if (imageUrlInput && imagePreview) {
    imageUrlInput.addEventListener('input', () => {
      const url = imageUrlInput.value.trim();
      if (url) {
        imagePreview.src = url;
      } else {
        imagePreview.src = '/uploads/default-news.png';
      }
    });

    imagePreview.addEventListener('error', () => {
      imagePreview.src = 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&auto=format&fit=crop&q=60';
    });
  }

  // Handle Form Submission
  const form = document.getElementById('shareNewsForm');
  const successAlert = document.getElementById('successAlert');
  const errorAlert = document.getElementById('errorAlert');
  const submitBtn = document.getElementById('submitNewsBtn');
  const spinner = document.getElementById('submitSpinner');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (successAlert) successAlert.classList.add('d-none');
      if (errorAlert) errorAlert.classList.add('d-none');

      const title = document.getElementById('newsTitle').value.trim();
      const category = document.getElementById('newsCategory').value;
      const eventDate = document.getElementById('eventDate').value;
      const location = document.getElementById('location').value.trim();
      const source = document.getElementById('source').value.trim();
      const imageUrl = imageUrlInput.value.trim();
      const description = document.getElementById('description').value.trim();

      if (!title || !category || !description) {
        showFormError('Please fill out all required fields.');
        return;
      }

      // Show spinner
      submitBtn.disabled = true;
      if (spinner) spinner.classList.remove('d-none');

      try {
        const response = await fetch('/api/news', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title,
            category,
            eventDate: eventDate || undefined,
            location: location || undefined,
            source: source || undefined,
            imageUrl: imageUrl || undefined,
            description
          })
        });

        const result = await response.json();

        if (result.success) {
          form.classList.add('d-none');
          if (successAlert) successAlert.classList.remove('d-none');
          showSuccessToast('News submitted successfully.');
        } else {
          showFormError(result.message || 'Submission failed.');
          submitBtn.disabled = false;
          if (spinner) spinner.classList.add('d-none');
        }
      } catch (err) {
        console.error('Submission error:', err);
        showFormError('Network or server error. Try again.');
        submitBtn.disabled = false;
        if (spinner) spinner.classList.add('d-none');
      }
    });
  }

  // Load Categories list
  async function loadCategoriesSelect() {
    const categorySelect = document.getElementById('newsCategory');
    if (!categorySelect) return;

    try {
      const res = await fetch('/api/categories');
      const result = await res.json();

      if (result.success && result.data.length > 0) {
        // Clear all except the first placeholder option
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        result.data.forEach(cat => {
          const opt = document.createElement('option');
          opt.value = cat.name;
          opt.innerText = cat.name;
          categorySelect.appendChild(opt);
        });
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }

  // Error Helper
  function showFormError(msg) {
    if (errorAlert) {
      errorAlert.innerText = msg;
      errorAlert.classList.remove('d-none');
    } else {
      showErrorToast(msg);
    }
  }
});
