<script>
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { submitNews, getCategories, uploadNewsImage } from '$lib/firebaseService.js';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let title = $state('');
  let category = $state('');
  let eventDate = $state('');
  let location = $state('');
  let source = $state('');
  let imageUrl = $state('');
  let description = $state('');
  let categories = $state([]);
  let loading = $state(false);
  let success = $state(false);
  let errorMsg = $state('');
  let imageFile = $state(null);
  let currentUser = $state(null);
  let previewUrl = $state('');
  let charCount = $state(0);

  onMount(async () => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) { goto('/login'); return; }
      currentUser = JSON.parse(stored);
      const res = await getCategories();
      if (res.success) categories = res.data;
    } catch (e) {}
  });

  function handleUrlInput() {
    if (imageUrl && imageUrl.startsWith('http')) previewUrl = imageUrl;
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      imageFile = file;
      previewUrl = URL.createObjectURL(file);
      imageUrl = '';
    }
  }

  function handleDescChange(e) {
    charCount = description.length;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !category || !description.trim()) {
      errorMsg = 'Please fill out all required fields (Title, Category, Description).';
      return;
    }
    if (description.trim().length < 50) {
      errorMsg = 'Description must be at least 50 characters for quality submissions.';
      return;
    }

    loading = true;
    errorMsg = '';
    success = false;

    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        const uploadRes = await uploadNewsImage(imageFile);
        if (uploadRes.success) finalImageUrl = uploadRes.url;
      }

      const res = await submitNews({
        title: title.trim(),
        category,
        eventDate,
        location: location.trim(),
        source: source.trim(),
        imageUrl: finalImageUrl || '/uploads/logo.png',
        description: description.trim()
      }, currentUser);

      if (res.success) {
        success = true;
        title = ''; category = ''; eventDate = ''; location = ''; source = '';
        imageUrl = ''; description = ''; imageFile = null; previewUrl = ''; charCount = 0;
      }
    } catch (err) {
      errorMsg = err.message || 'Failed to submit article. Please try again.';
    } finally {
      loading = false;
    }
  }

  function submitAnother() {
    success = false;
    title = ''; category = ''; description = '';
  }
</script>

<svelte:head>
  <title>Share Campus News - SonaInfo</title>
  <meta name="description" content="Submit news, events, or announcements to the SonaInfo campus news portal for administrative review and publishing.">
</svelte:head>

<Navbar />

<main class="container my-5">
  <div class="row justify-content-center">
    <div class="col-lg-9">

      {#if success}
        <!-- Success State -->
        <div class="card border-0 shadow-sm p-5 rounded-4 bg-white text-center">
          <div class="mb-4">
            <div class="rounded-circle bg-success bg-opacity-10 text-success d-inline-flex align-items-center justify-content-center mb-3" style="width:80px;height:80px;font-size:2rem;">
              <i class="bi bi-check2-circle"></i>
            </div>
            <h3 class="fw-bold text-dark">Submission Successful!</h3>
            <p class="text-muted">Your news article has been submitted and is now pending admin review. You'll be notified once it's approved.</p>
          </div>
          <div class="alert alert-success rounded-4 text-start mb-4">
            <i class="bi bi-info-circle-fill me-2"></i>
            Admin will review your article and either <strong>approve</strong> or <strong>reject</strong> it. Approved articles appear on the campus news feed.
          </div>
          <div class="d-flex flex-wrap gap-3 justify-content-center">
            <a href="/my-news" class="btn btn-success rounded-pill px-4 fw-bold">
              <i class="bi bi-journal-text me-1"></i> View My Submissions
            </a>
            <button class="btn btn-outline-primary rounded-pill px-4" onclick={submitAnother}>
              <i class="bi bi-plus-circle me-1"></i> Submit Another
            </button>
            <a href="/news" class="btn btn-outline-secondary rounded-pill px-4">
              <i class="bi bi-newspaper me-1"></i> Browse News
            </a>
          </div>
        </div>
      {:else}
        <div class="card border-0 shadow-sm p-4 rounded-4 bg-white">
          <!-- Header -->
          <div class="d-flex align-items-center gap-3 border-bottom pb-3 mb-4">
            <div class="p-3 bg-warning bg-opacity-10 text-warning rounded-3 fs-3"><i class="bi bi-megaphone"></i></div>
            <div>
              <h3 class="fw-bold mb-0 text-dark">Share Campus News</h3>
              <p class="text-muted small mb-0">
                {#if currentUser?.role === 'admin'}
                  As admin, your articles are published directly without review.
                {:else}
                  Submit news, events, or announcements for administrative review and publishing.
                {/if}
              </p>
            </div>
            {#if currentUser}
              <div class="ms-auto d-flex align-items-center gap-2">
                <div class="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold" style="width:36px;height:36px;">
                  {(currentUser.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <span class="small fw-bold text-dark d-block">{currentUser.name}</span>
                  <span class="badge {currentUser.role === 'admin' ? 'bg-warning text-dark' : 'bg-primary'} small">{currentUser.role.toUpperCase()}</span>
                </div>
              </div>
            {/if}
          </div>

          {#if errorMsg}
            <div class="alert alert-danger rounded-3 mb-4" role="alert">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>{errorMsg}
            </div>
          {/if}

          <form onsubmit={handleSubmit}>
            <div class="row g-3">
              <!-- Title -->
              <div class="col-12">
                <label for="newsTitle" class="form-label fw-bold">News Title <span class="text-danger">*</span></label>
                <input type="text" class="form-control bg-light" id="newsTitle" bind:value={title} placeholder="Enter a clear, descriptive headline..." required maxlength="120">
                <div class="form-text">{title.length}/120 characters</div>
              </div>

              <!-- Category -->
              <div class="col-md-6">
                <label for="newsCategory" class="form-label fw-bold">Category <span class="text-danger">*</span></label>
                <select class="form-select bg-light" id="newsCategory" bind:value={category} required>
                  <option value="">Select Category</option>
                  {#if categories.length > 0}
                    {#each categories as cat}
                      <option value={cat.name}>{cat.name}</option>
                    {/each}
                  {:else}
                    <option value="College News">College News</option>
                    <option value="Events">Events</option>
                    <option value="Exam Updates">Exam Updates</option>
                    <option value="Placements">Placements</option>
                    <option value="Workshops">Workshops</option>
                    <option value="Achievements">Achievements</option>
                    <option value="Sports">Sports</option>
                    <option value="Clubs">Clubs</option>
                    <option value="Internships">Internships</option>
                    <option value="General Information">General Information</option>
                  {/if}
                </select>
              </div>

              <!-- Event Date -->
              <div class="col-md-6">
                <label for="eventDate" class="form-label fw-bold">Event Date <span class="text-muted">(Optional)</span></label>
                <input type="date" class="form-control bg-light" id="eventDate" bind:value={eventDate}>
              </div>

              <!-- Location -->
              <div class="col-md-6">
                <label for="location" class="form-label fw-bold">Location <span class="text-muted">(Optional)</span></label>
                <input type="text" class="form-control bg-light" id="location" bind:value={location} placeholder="e.g. Main Auditorium, Lab 1...">
              </div>

              <!-- Source -->
              <div class="col-md-6">
                <label for="source" class="form-label fw-bold">Source / Reference <span class="text-muted">(Optional)</span></label>
                <input type="text" class="form-control bg-light" id="source" bind:value={source} placeholder="e.g. HOD Office, Placement Cell...">
              </div>

              <!-- Image Section -->
              <div class="col-12">
                <label for="imageUrl" class="form-label fw-bold">Featured Image <span class="text-muted">(Optional)</span></label>
                <div class="row g-2">
                  <div class="col-md-8">
                    <input type="url" class="form-control bg-light mb-2" id="imageUrl" bind:value={imageUrl} placeholder="https://images.unsplash.com/..." oninput={handleUrlInput}>
                    <input type="file" class="form-control bg-light" accept="image/*" id="imageFile" onchange={handleFileChange}>
                    <div class="form-text small">Paste a URL or upload an image file.</div>
                  </div>
                  <div class="col-md-4">
                    <div class="border rounded-3 p-2 bg-light text-center" style="height: 90px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                      {#if previewUrl}
                        <img src={previewUrl} alt="Preview" style="max-height: 82px; max-width: 100%; object-fit: contain; border-radius: 8px;"
                          onerror={(e) => { e.currentTarget.src = '/uploads/logo.png'; }}>
                      {:else}
                        <span class="text-muted small"><i class="bi bi-image d-block fs-4 mb-1"></i>Preview</span>
                      {/if}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div class="col-12">
                <label for="description" class="form-label fw-bold">Description / Details <span class="text-danger">*</span></label>
                <textarea class="form-control bg-light" id="description" rows="7" bind:value={description} oninput={handleDescChange}
                  placeholder="Write full details about the news, event, or announcement. Include who, what, when, where, and why... (minimum 50 characters)" required></textarea>
                <div class="form-text d-flex justify-content-between">
                  <span>{charCount} characters</span>
                  {#if charCount > 0 && charCount < 50}
                    <span class="text-danger">Need at least {50 - charCount} more characters</span>
                  {:else if charCount >= 50}
                    <span class="text-success"><i class="bi bi-check-circle me-1"></i>Good length</span>
                  {/if}
                </div>
              </div>
            </div>

            <!-- Info box -->
            {#if currentUser?.role !== 'admin'}
              <div class="alert alert-info rounded-3 mt-3 small">
                <i class="bi bi-info-circle-fill me-2"></i>
                Your submission will be reviewed by an administrator before being published on the campus news feed. Ensure all details are accurate.
              </div>
            {:else}
              <div class="alert alert-success rounded-3 mt-3 small">
                <i class="bi bi-patch-check-fill me-2"></i>
                As an admin, your news will be published directly and immediately visible on the campus feed.
              </div>
            {/if}

            <!-- Submit -->
            <button type="submit" class="btn btn-primary-custom px-5 py-2 fw-bold text-dark rounded-3 mt-3 d-flex align-items-center gap-2" disabled={loading}>
              {#if loading}
                <div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>
              {:else}
                <i class="bi bi-send-fill"></i>
              {/if}
              <span>{loading ? 'Submitting...' : currentUser?.role === 'admin' ? 'Publish Directly' : 'Submit for Review'}</span>
            </button>
          </form>
        </div>
      {/if}
    </div>
  </div>
</main>

<Footer />
