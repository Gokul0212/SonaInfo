<script>
  import AdminSidebar from '$lib/components/AdminSidebar.svelte';
  import { getNewsList, updateNews } from '$lib/firebaseService.js';
  import { formatDate } from '$lib/stores.js';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let pendingList = $state([]);
  let loading = $state(true);
  let selectedItem = $state(null);
  let showReviewModal = $state(false);
  let actionLoading = $state(false);

  onMount(async () => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) {
        goto('/login?role=admin');
        return;
      }
      const u = JSON.parse(stored);
      if (u.role !== 'admin') {
        goto('/login?role=admin');
        return;
      }
      await loadPending();
    } catch (e) {
      console.error(e);
    }
  });

  async function loadPending() {
    loading = true;
    try {
      const res = await getNewsList({ limit: 100, status: 'pending' });
      if (res.success) {
        pendingList = res.data;
      }
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  async function handleApprove(id) {
    actionLoading = true;
    try {
      await updateNews(id, { status: 'approved' });
      showReviewModal = false;
      await loadPending();
    } catch (e) {
      alert('Error approving submission');
    } finally {
      actionLoading = false;
    }
  }

  async function handleReject(id) {
    actionLoading = true;
    try {
      await updateNews(id, { status: 'rejected' });
      showReviewModal = false;
      await loadPending();
    } catch (e) {
      alert('Error rejecting submission');
    } finally {
      actionLoading = false;
    }
  }

  function openReview(item) {
    selectedItem = item;
    showReviewModal = true;
  }
</script>

<svelte:head>
  <title>Pending Review - SonaInfo Admin</title>
</svelte:head>

<div class="admin-wrapper d-flex">
  <AdminSidebar />

  <div id="content" class="p-4 flex-grow-1">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h2 class="fw-bold mb-0 text-dark">Pending Review</h2>
        <p class="text-muted small mb-0">Approve or reject student article submissions</p>
      </div>
    </div>

    <!-- Table Card -->
    <div class="card border-0 shadow-sm p-4 rounded-4 bg-white">
      {#if loading}
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading submissions...</span>
          </div>
        </div>
      {:else if pendingList.length === 0}
        <div class="text-center py-5">
          <i class="bi bi-patch-check text-muted display-3"></i>
          <h5 class="mt-3 fw-bold text-dark">No Pending Submissions</h5>
          <p class="text-muted small">All student articles have been reviewed and processed!</p>
        </div>
      {:else}
        <div class="table-responsive">
          <table class="table align-middle table-hover">
            <thead class="table-light">
              <tr>
                <th scope="col">Image</th>
                <th scope="col" style="min-width: 200px;">Title</th>
                <th scope="col">Student</th>
                <th scope="col">Category</th>
                <th scope="col">Date</th>
                <th scope="col" class="text-center" style="min-width: 280px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each pendingList as item}
                <tr>
                  <td>
                    <img src={item.imageUrl || '/uploads/logo.png'} alt="thumbnail" class="rounded-3" style="width: 55px; height: 55px; object-fit: cover;" onerror={(e) => { e.currentTarget.src = '/uploads/logo.png'; }}>
                  </td>
                  <td>
                    <strong class="text-dark d-block truncate" style="max-width: 250px;" title={item.title}>{item.title}</strong>
                  </td>
                  <td><span class="text-secondary small fw-semibold">{item.authorName}</span></td>
                  <td><span class="badge bg-secondary">{item.category}</span></td>
                  <td class="small text-muted">{formatDate(item.createdAt)}</td>
                  <td class="text-center">
                    <div class="d-flex justify-content-center gap-2">
                      <button class="btn btn-outline-primary btn-sm rounded-pill px-3" onclick={() => openReview(item)}>
                        <i class="bi bi-eye me-1"></i> Review
                      </button>
                      <button class="btn btn-success btn-sm rounded-pill px-3" onclick={() => handleApprove(item.id || item._id)}>
                        <i class="bi bi-check-circle me-1"></i> Approve
                      </button>
                      <button class="btn btn-danger btn-sm rounded-pill px-3" onclick={() => handleReject(item.id || item._id)}>
                        <i class="bi bi-x-circle me-1"></i> Reject
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

<!-- Details Review Modal -->
{#if showReviewModal && selectedItem}
  <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.6);" role="dialog">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow-lg" style="border-radius: 20px;">
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title fw-bold text-dark">Submission Review</h5>
          <button type="button" class="btn-close" aria-label="Close" onclick={() => showReviewModal = false}></button>
        </div>
        <div class="modal-body py-4">
          <div class="row g-4">
            <div class="col-md-5">
              <img src={selectedItem.imageUrl || '/uploads/logo.png'} class="img-fluid rounded-4 shadow-sm w-100" style="max-height: 250px; object-fit: cover;" alt="Submission thumbnail" onerror={(e) => { e.currentTarget.src = '/uploads/logo.png'; }}>
            </div>
            <div class="col-md-7">
              <span class="badge bg-primary mb-2">{selectedItem.category}</span>
              <h4 class="fw-bold text-dark mb-2">{selectedItem.title}</h4>
              <p class="text-muted small mb-3">Submitted by: <strong>{selectedItem.authorName}</strong> on {formatDate(selectedItem.createdAt)}</p>
              
              <div class="row g-2 mb-3 bg-light rounded-3 p-2.5 small">
                <div class="col-6">Event Date: <strong>{selectedItem.eventDate ? formatDate(selectedItem.eventDate) : 'N/A'}</strong></div>
                <div class="col-6">Location: <strong>{selectedItem.location || 'N/A'}</strong></div>
                <div class="col-12">Source: <strong>{selectedItem.source || 'N/A'}</strong></div>
              </div>

              <div style="max-height: 200px; overflow-y: auto;">
                <p class="text-secondary small lh-lg" style="white-space: pre-wrap;">{selectedItem.description}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer border-0 pt-0 d-flex justify-content-between">
          <button type="button" class="btn btn-secondary rounded-pill px-4" onclick={() => showReviewModal = false}>Close</button>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-danger rounded-pill px-4" onclick={() => handleReject(selectedItem.id || selectedItem._id)} disabled={actionLoading}>
              <i class="bi bi-x-circle me-1"></i> Reject
            </button>
            <button type="button" class="btn btn-success rounded-pill px-4" onclick={() => handleApprove(selectedItem.id || selectedItem._id)} disabled={actionLoading}>
              <i class="bi bi-check-circle me-1"></i> Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
