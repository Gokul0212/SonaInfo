<script>
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { getMySubmissions, deleteNews, updateNews } from '$lib/firebaseService.js';
  import { formatDate } from '$lib/stores.js';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let submissions = $state([]);
  let loading = $state(true);
  let user = $state(null);
  let selectedItem = $state(null);
  let showModal = $state(false);

  // Edit modal
  let showEditModal = $state(false);
  let editTitle = $state('');
  let editDescription = $state('');
  let editImageUrl = $state('');
  let editLocation = $state('');
  let editSource = $state('');
  let editId = $state(null);
  let editSaving = $state(false);
  let editError = $state('');

  onMount(async () => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) { goto('/login'); return; }
      user = JSON.parse(stored);
      await loadSubmissions();
    } catch (e) { console.error(e); }
    finally { loading = false; }
  });

  async function loadSubmissions() {
    loading = true;
    try {
      const res = await getMySubmissions(user.id || user.userId);
      if (res.success) submissions = res.data;
    } catch (e) { console.error(e); }
    finally { loading = false; }
  }

  function openPreview(item) {
    selectedItem = item;
    showModal = true;
  }

  function openEdit(item) {
    if (item.status !== 'pending') {
      alert('Only pending submissions can be edited.');
      return;
    }
    editId = item.id || item._id;
    editTitle = item.title || '';
    editDescription = item.description || '';
    editImageUrl = item.imageUrl || '';
    editLocation = item.location || '';
    editSource = item.source || '';
    editError = '';
    showEditModal = true;
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!editTitle.trim() || !editDescription.trim()) { editError = 'Title and description are required.'; return; }
    editSaving = true; editError = '';
    try {
      await updateNews(editId, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        imageUrl: editImageUrl || '/uploads/logo.png',
        location: editLocation,
        source: editSource
      });
      showEditModal = false;
      await loadSubmissions();
    } catch (e) {
      editError = e.message || 'Failed to update article.';
    } finally { editSaving = false; }
  }

  async function handleDelete(id) {
    if (confirm('Are you sure you want to delete this submission?')) {
      await deleteNews(id);
      await loadSubmissions();
    }
  }
</script>

<svelte:head>
  <title>My Submissions - SonaInfo</title>
</svelte:head>

<Navbar />

<main class="container my-5">
  <div class="card border-0 shadow-sm p-4 rounded-4 bg-white">
    <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4 flex-wrap gap-3">
      <div class="d-flex align-items-center gap-3">
        <div class="p-3 bg-info bg-opacity-10 text-info rounded-3 fs-3"><i class="bi bi-file-earmark-text"></i></div>
        <div>
          <h3 class="fw-bold mb-0 text-dark">My Submissions</h3>
          <p class="text-muted small mb-0">Track the review and approval status of your shared articles.</p>
        </div>
      </div>
      <a href="/share-news" class="btn btn-primary-custom fw-bold text-dark rounded-pill px-4"><i class="bi bi-plus-circle me-1"></i> Share News</a>
    </div>

    <!-- Summary badges -->
    {#if !loading && submissions.length > 0}
      <div class="d-flex flex-wrap gap-2 mb-4">
        <span class="badge bg-secondary px-3 py-2 rounded-pill"><i class="bi bi-collection me-1"></i>{submissions.length} Total</span>
        <span class="badge bg-warning text-dark px-3 py-2 rounded-pill"><i class="bi bi-hourglass-split me-1"></i>{submissions.filter(s => s.status === 'pending').length} Pending</span>
        <span class="badge bg-success px-3 py-2 rounded-pill"><i class="bi bi-check-circle me-1"></i>{submissions.filter(s => s.status === 'approved').length} Approved</span>
        <span class="badge bg-danger px-3 py-2 rounded-pill"><i class="bi bi-x-circle me-1"></i>{submissions.filter(s => s.status === 'rejected').length} Rejected</span>
      </div>
    {/if}

    {#if loading}
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
        <p class="mt-3 text-muted small">Loading your submissions...</p>
      </div>
    {:else if submissions.length === 0}
      <div class="text-center py-5">
        <i class="bi bi-folder2-open text-muted display-3"></i>
        <h5 class="mt-3 fw-bold text-dark">No Submissions Yet</h5>
        <p class="text-muted">You haven't submitted any campus news or updates yet.</p>
        <a href="/share-news" class="btn btn-outline-primary btn-sm rounded-pill px-4 mt-2">Submit Your First Article</a>
      </div>
    {:else}
      <div class="table-responsive">
        <table class="table align-middle table-hover border-top">
          <thead class="table-light">
            <tr>
              <th scope="col">Image</th>
              <th scope="col" style="min-width: 250px;">Title</th>
              <th scope="col">Category</th>
              <th scope="col">Submitted</th>
              <th scope="col">Status</th>
              <th scope="col" class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each submissions as item}
              <tr>
                <td>
                  <img src={item.imageUrl || '/uploads/logo.png'} alt="thumb" class="rounded-3" style="width:45px;height:45px;object-fit:cover;"
                    onerror={(e) => { e.currentTarget.src = '/uploads/logo.png'; }}>
                </td>
                <td>
                  <strong class="text-dark d-block" style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title={item.title}>{item.title}</strong>
                  <small class="text-muted">{item.location || ''}</small>
                </td>
                <td><span class="text-secondary small fw-semibold">{item.category}</span></td>
                <td class="small text-muted">{formatDate(item.createdAt)}</td>
                <td>
                  {#if item.status === 'pending'}
                    <span class="badge bg-warning text-dark"><i class="bi bi-hourglass-split me-1"></i>Pending</span>
                  {:else if item.status === 'approved'}
                    <span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Approved</span>
                  {:else}
                    <span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>Rejected</span>
                  {/if}
                </td>
                <td class="text-center">
                  <div class="d-flex justify-content-center gap-2">
                    <button class="btn btn-outline-primary btn-sm rounded-pill px-3" onclick={() => openPreview(item)}>
                      <i class="bi bi-eye me-1"></i> View
                    </button>
                    {#if item.status === 'pending'}
                      <button class="btn btn-outline-secondary btn-sm rounded-pill px-3" onclick={() => openEdit(item)}>
                        <i class="bi bi-pencil me-1"></i> Edit
                      </button>
                      <button class="btn btn-outline-danger btn-sm rounded-pill" onclick={() => handleDelete(item.id || item._id)} title="Delete submission">
                        <i class="bi bi-trash"></i>
                      </button>
                    {/if}
                    {#if item.status === 'approved'}
                      <a href="/news/{item.id || item._id}" class="btn btn-outline-success btn-sm rounded-pill px-3">
                        <i class="bi bi-box-arrow-up-right me-1"></i>View Live
                      </a>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</main>

<!-- Preview Modal -->
{#if showModal && selectedItem}
  <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.6);" role="dialog" aria-modal="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow-lg" style="border-radius: 20px;">
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title fw-bold text-dark">Submission Details</h5>
          <button type="button" class="btn-close" aria-label="Close" onclick={() => showModal = false}></button>
        </div>
        <div class="modal-body py-4">
          <div class="row g-4">
            <div class="col-md-5">
              <img src={selectedItem.imageUrl || '/uploads/logo.png'} class="img-fluid rounded-4 shadow-sm w-100" style="max-height:250px;object-fit:cover;" alt="Preview"
                onerror={(e) => { e.currentTarget.src = '/uploads/logo.png'; }}>
            </div>
            <div class="col-md-7">
              <div class="d-flex gap-2 mb-2 flex-wrap">
                <span class="badge bg-secondary">{selectedItem.category}</span>
                <span class="badge {selectedItem.status === 'approved' ? 'bg-success' : selectedItem.status === 'pending' ? 'bg-warning text-dark' : 'bg-danger'}">{selectedItem.status?.toUpperCase()}</span>
              </div>
              <h4 class="fw-bold text-dark mb-3">{selectedItem.title}</h4>
              <div class="row g-2 mb-3 bg-light rounded-3 p-2 small">
                <div class="col-6"><i class="bi bi-calendar-event me-1"></i>Event: <span class="fw-semibold">{selectedItem.eventDate ? formatDate(selectedItem.eventDate) : 'None'}</span></div>
                <div class="col-6"><i class="bi bi-geo-alt me-1"></i>Location: <span class="fw-semibold">{selectedItem.location || 'None'}</span></div>
                <div class="col-12 mt-1"><i class="bi bi-link-45deg me-1"></i>Reference: <span class="fw-semibold">{selectedItem.source || 'None'}</span></div>
              </div>
              <div style="max-height: 180px; overflow-y: auto;">
                <p class="text-muted small lh-lg" style="white-space: pre-wrap;">{selectedItem.description}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer border-0 pt-0">
          <button type="button" class="btn btn-secondary rounded-pill px-4" onclick={() => showModal = false}>Close</button>
          {#if selectedItem.status === 'approved'}
            <a href="/news/{selectedItem.id || selectedItem._id}" class="btn btn-success rounded-pill px-4">
              <i class="bi bi-box-arrow-up-right me-1"></i> View Live
            </a>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Edit Modal (only for pending articles) -->
{#if showEditModal}
  <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.65);" role="dialog" aria-modal="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow-lg" style="border-radius: 20px;">
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title fw-bold text-dark"><i class="bi bi-pencil-square text-primary me-2"></i>Edit Pending Submission</h5>
          <button type="button" class="btn-close" aria-label="Close" onclick={() => showEditModal = false}></button>
        </div>
        <form onsubmit={handleEdit}>
          <div class="modal-body py-4">
            {#if editError}
              <div class="alert alert-danger rounded-3 small">{editError}</div>
            {/if}
            <div class="row g-3">
              <div class="col-12">
                <label for="editTitle" class="form-label fw-bold small">Title <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="editTitle" bind:value={editTitle} required>
              </div>
              <div class="col-md-6">
                <label for="editLocation" class="form-label fw-bold small">Location</label>
                <input type="text" class="form-control" id="editLocation" bind:value={editLocation} placeholder="Event location">
              </div>
              <div class="col-md-6">
                <label for="editSource" class="form-label fw-bold small">Source</label>
                <input type="text" class="form-control" id="editSource" bind:value={editSource} placeholder="Reference source">
              </div>
              <div class="col-12">
                <label for="editImageUrl" class="form-label fw-bold small">Image URL</label>
                <input type="url" class="form-control" id="editImageUrl" bind:value={editImageUrl} placeholder="https://...">
              </div>
              <div class="col-12">
                <label for="editDescription" class="form-label fw-bold small">Description <span class="text-danger">*</span></label>
                <textarea class="form-control" id="editDescription" rows="6" bind:value={editDescription} required></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-secondary rounded-pill px-4" onclick={() => showEditModal = false}>Cancel</button>
            <button type="submit" class="btn btn-primary rounded-pill px-4 fw-bold" disabled={editSaving}>
              {#if editSaving}<span class="spinner-border spinner-border-sm me-2"></span>{/if}
              {editSaving ? 'Saving...' : 'Update Submission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<Footer />
