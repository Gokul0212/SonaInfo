<script>
  import AdminSidebar from '$lib/components/AdminSidebar.svelte';
  import { getNewsList, getCategories, submitNews, updateNews, deleteNews } from '$lib/firebaseService.js';
  import { formatDate } from '$lib/stores.js';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let newsList = $state([]);
  let categories = $state([]);
  let loading = $state(true);
  let showModal = $state(false);
  let isEditing = $state(false);
  let editId = $state(null);
  let searchQuery = $state('');
  let statusFilter = $state('');

  // Form fields
  let title = $state('');
  let category = $state('');
  let eventDate = $state('');
  let location = $state('');
  let source = $state('');
  let imageUrl = $state('');
  let description = $state('');
  let status = $state('approved');
  let saveLoading = $state(false);
  let adminUser = $state(null);
  let previewImg = $state('');

  onMount(async () => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) { goto('/login?role=admin'); return; }
      adminUser = JSON.parse(stored);
      if (adminUser.role !== 'admin') { goto('/login?role=admin'); return; }
      await loadData();
    } catch (e) { console.error(e); }
  });

  async function loadData() {
    loading = true;
    try {
      const [nRes, cRes] = await Promise.all([
        getNewsList({ limit: 100, status: '' }),
        getCategories()
      ]);
      if (nRes.success) newsList = nRes.data;
      if (cRes.success) categories = cRes.data;
    } catch (e) { console.error(e); }
    finally { loading = false; }
  }

  function openAddModal() {
    isEditing = false; editId = null;
    title = ''; category = categories[0]?.name || 'College News';
    eventDate = ''; location = ''; source = 'Administrative Office';
    imageUrl = ''; description = ''; status = 'approved'; previewImg = '';
    showModal = true;
  }

  function openEditModal(item) {
    isEditing = true; editId = item.id || item._id;
    title = item.title; category = item.category;
    eventDate = item.eventDate ? item.eventDate.split('T')[0] : '';
    location = item.location || ''; source = item.source || '';
    imageUrl = item.imageUrl || ''; description = item.description || '';
    status = item.status || 'approved'; previewImg = item.imageUrl || '';
    showModal = true;
  }

  function updatePreview() {
    previewImg = imageUrl;
  }

  async function handleSaveNews(e) {
    e.preventDefault();
    saveLoading = true;
    try {
      if (isEditing) {
        await updateNews(editId, { title, category, eventDate, location, source, imageUrl: imageUrl || '/uploads/logo.png', description, status });
      } else {
        await submitNews({ title, category, eventDate, location, source, imageUrl: imageUrl || '/uploads/logo.png', description }, adminUser);
      }
      showModal = false;
      await loadData();
    } catch (err) {
      alert(err.message || 'Error saving article');
    } finally { saveLoading = false; }
  }

  async function handleDelete(id) {
    if (confirm('Are you sure you want to permanently delete this article?')) {
      await deleteNews(id);
      await loadData();
    }
  }

  async function handleStatusToggle(item) {
    const newStatus = item.status === 'approved' ? 'pending' : 'approved';
    await updateNews(item.id || item._id, { status: newStatus });
    await loadData();
  }

  let filteredNews = $derived(newsList.filter(item => {
    const matchSearch = !searchQuery || item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || item.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = !statusFilter || item.status === statusFilter;
    return matchSearch && matchStatus;
  }));

  function statusBadge(s) {
    if (s === 'approved') return 'bg-success';
    if (s === 'pending') return 'bg-warning text-dark';
    return 'bg-danger';
  }
</script>

<svelte:head>
  <title>Manage News - SonaInfo Admin</title>
</svelte:head>

<div class="admin-wrapper d-flex">
  <AdminSidebar />

  <div id="content" class="p-4 flex-grow-1">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h2 class="fw-bold mb-0 text-dark font-heading"><i class="bi bi-newspaper text-primary me-2"></i>News Management</h2>
        <p class="text-muted small mb-0">Create, edit, or delete campus news articles</p>
      </div>
      <button class="btn btn-success rounded-pill px-4 fw-bold" onclick={openAddModal}>
        <i class="bi bi-plus-circle me-1"></i> Add New Article
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="card border-0 shadow-sm p-3 rounded-4 bg-white mb-4">
      <div class="row g-3 align-items-end">
        <div class="col-md-5">
          <label for="newsSearch" class="form-label small fw-bold text-muted">Search</label>
          <div class="input-group">
            <span class="input-group-text bg-light"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control bg-light" id="newsSearch" bind:value={searchQuery} placeholder="Title, category...">
          </div>
        </div>
        <div class="col-md-3">
          <label for="statusFilter" class="form-label small fw-bold text-muted">Status</label>
          <select class="form-select bg-light" id="statusFilter" bind:value={statusFilter}>
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div class="col-md-4 d-flex align-items-center gap-2">
          <span class="badge bg-info-subtle text-info px-3 py-2 rounded-pill fw-semibold">
            <i class="bi bi-newspaper me-1"></i>{filteredNews.length} Articles
          </span>
          {#if searchQuery || statusFilter}
            <button class="btn btn-light btn-sm rounded-pill px-3" onclick={() => { searchQuery=''; statusFilter=''; }}>
              <i class="bi bi-x-circle me-1"></i>Clear
            </button>
          {/if}
        </div>
      </div>
    </div>

    <!-- Management Card -->
    <div class="card border-0 shadow-sm p-4 rounded-4 bg-white">
      {#if loading}
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
          <p class="mt-3 text-muted small">Loading articles...</p>
        </div>
      {:else if filteredNews.length === 0}
        <div class="text-center py-5">
          <i class="bi bi-newspaper text-muted display-3"></i>
          <h5 class="mt-3 fw-bold text-dark">No Articles Found</h5>
          <p class="text-muted small">{searchQuery || statusFilter ? 'Try clearing your filters.' : 'No articles have been created yet.'}</p>
          {#if !searchQuery && !statusFilter}
            <button class="btn btn-outline-success rounded-pill px-4 mt-2" onclick={openAddModal}>
              <i class="bi bi-plus-circle me-1"></i> Create First Article
            </button>
          {/if}
        </div>
      {:else}
        <div class="table-responsive">
          <table class="table align-middle table-hover border-top">
            <thead class="table-light">
              <tr>
                <th scope="col">Image</th>
                <th scope="col" style="min-width: 250px;">Title</th>
                <th scope="col">Category</th>
                <th scope="col">Author</th>
                <th scope="col">Date</th>
                <th scope="col">Status</th>
                <th scope="col" class="text-center" style="min-width: 200px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredNews as item}
                <tr>
                  <td>
                    <img src={item.imageUrl || '/uploads/logo.png'} alt="thumb" class="rounded-3" style="width: 50px; height: 50px; object-fit: cover;"
                      onerror={(e) => { e.currentTarget.src = '/uploads/logo.png'; }}>
                  </td>
                  <td>
                    <strong class="text-dark d-block" style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title={item.title}>{item.title}</strong>
                    <small class="text-muted">{item.location || ''}</small>
                  </td>
                  <td><span class="badge bg-secondary">{item.category}</span></td>
                  <td class="small text-muted">{item.authorName}</td>
                  <td class="small text-muted">{formatDate(item.createdAt)}</td>
                  <td>
                    <span class="badge {statusBadge(item.status)}">{(item.status || 'pending').toUpperCase()}</span>
                  </td>
                  <td class="text-center">
                    <div class="d-flex justify-content-center gap-2">
                      <button class="btn btn-outline-primary btn-sm rounded-pill px-3" onclick={() => openEditModal(item)} title="Edit article">
                        <i class="bi bi-pencil"></i> Edit
                      </button>
                      <button class="btn btn-outline-danger btn-sm rounded-pill px-3" aria-label="Delete article" onclick={() => handleDelete(item.id || item._id)} title="Delete article">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Add/Edit Modal -->
{#if showModal}
  <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.65);" role="dialog" aria-modal="true">
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content border-0 shadow-lg" style="border-radius: 20px;">
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title fw-bold text-dark">
            <i class="bi bi-{isEditing ? 'pencil-square text-primary' : 'plus-circle text-success'} me-2"></i>
            {isEditing ? 'Edit News Article' : 'Publish New Campus Article'}
          </h5>
          <button type="button" class="btn-close" aria-label="Close" onclick={() => showModal = false}></button>
        </div>
        <form onsubmit={handleSaveNews}>
          <div class="modal-body py-4">
            <div class="row g-4">
              <!-- Left: Form Fields -->
              <div class="col-lg-7">
                <div class="row g-3">
                  <div class="col-12">
                    <label for="title" class="form-label fw-bold small">Article Title <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="title" bind:value={title} placeholder="Enter a compelling headline..." required>
                  </div>
                  <div class="col-md-6">
                    <label for="category" class="form-label fw-bold small">Category <span class="text-danger">*</span></label>
                    <select class="form-select" id="category" bind:value={category} required>
                      {#each categories as cat}
                        <option value={cat.name}>{cat.name}</option>
                      {/each}
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label for="status" class="form-label fw-bold small">Publication Status</label>
                    <select class="form-select" id="status" bind:value={status}>
                      <option value="approved">✅ Approved (Published)</option>
                      <option value="pending">⏳ Pending Review</option>
                      <option value="rejected">❌ Rejected</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label for="eventDate" class="form-label fw-bold small">Event Date</label>
                    <input type="date" class="form-control" id="eventDate" bind:value={eventDate}>
                  </div>
                  <div class="col-md-6">
                    <label for="location" class="form-label fw-bold small">Location</label>
                    <input type="text" class="form-control" id="location" bind:value={location} placeholder="e.g. Main Auditorium">
                  </div>
                  <div class="col-12">
                    <label for="source" class="form-label fw-bold small">Source / Reference</label>
                    <input type="text" class="form-control" id="source" bind:value={source} placeholder="e.g. Administrative Office, Placement Cell">
                  </div>
                  <div class="col-12">
                    <label for="description" class="form-label fw-bold small">Full Description <span class="text-danger">*</span></label>
                    <textarea class="form-control" id="description" rows="6" bind:value={description} placeholder="Provide comprehensive details about the news, event, or announcement..." required></textarea>
                  </div>
                </div>
              </div>
              <!-- Right: Image -->
              <div class="col-lg-5">
                <label for="imageUrl" class="form-label fw-bold small">Featured Image URL</label>
                <input type="url" class="form-control mb-2" id="imageUrl" bind:value={imageUrl} placeholder="https://images.unsplash.com/..." oninput={updatePreview}>
                <div class="small text-muted mb-3">Paste an Unsplash or direct image URL to feature this article.</div>
                <div class="border rounded-4 p-2 bg-light" style="min-height: 240px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                  {#if imageUrl || previewImg}
                    <img src={imageUrl || previewImg || '/uploads/logo.png'} alt="Preview" style="max-height: 230px; max-width: 100%; object-fit: contain; border-radius: 12px;"
                      onerror={(e) => { e.currentTarget.src = '/uploads/logo.png'; }}>
                  {:else}
                    <div class="text-center text-muted p-3">
                      <i class="bi bi-image display-4 d-block mb-2"></i>
                      <small>Image preview appears here</small>
                    </div>
                  {/if}
                </div>
                <div class="mt-3 p-3 bg-light rounded-3 border">
                  <p class="small fw-bold text-dark mb-2"><i class="bi bi-lightbulb text-warning me-1"></i>Unsplash Quick Links</p>
                  <div class="d-flex flex-wrap gap-2">
                    {#each ['events', 'education', 'sports', 'technology', 'achievement'] as kw}
                      <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill" onclick={() => { imageUrl = `https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3`; previewImg = imageUrl; }}>
                        {kw}
                      </button>
                    {/each}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-secondary rounded-pill px-4" onclick={() => showModal = false}>Cancel</button>
            <button type="submit" class="btn btn-primary-custom text-dark fw-bold rounded-pill px-5" disabled={saveLoading}>
              {#if saveLoading}
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
              {/if}
              {saveLoading ? 'Saving...' : isEditing ? '✏️ Update Article' : '🚀 Publish Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}
