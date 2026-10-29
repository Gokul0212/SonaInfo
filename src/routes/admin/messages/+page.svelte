<script>
  import AdminSidebar from '$lib/components/AdminSidebar.svelte';
  import { getAllUserMessages, updateUserMessageStatus } from '$lib/firebaseService.js';
  import { formatDate } from '$lib/stores.js';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let messages = $state([]);
  let loading = $state(true);
  let filterStatus = $state('all');
  let filterType = $state('all');
  let searchQuery = $state('');

  // Selected message for details view / modal
  let selectedMessage = $state(null);
  let showViewModal = $state(false);
  let actionLoading = $state(false);
  let actionAlert = $state({ type: '', text: '' });

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
      await loadMessages();
    } catch (e) {
      console.error(e);
    }
  });

  async function loadMessages() {
    loading = true;
    try {
      const res = await getAllUserMessages();
      if (res.success) {
        messages = res.data;
      }
    } catch (e) {
      console.error('Error loading messages:', e);
    } finally {
      loading = false;
    }
  }

  async function handleStatusChange(messageId, newStatus) {
    actionLoading = true;
    actionAlert = { type: '', text: '' };
    try {
      const res = await updateUserMessageStatus(messageId, newStatus);
      if (res.success) {
        actionAlert = {
          type: 'success',
          text: `Message marked as "${newStatus}" successfully!`
        };
        // Update local selected message if open
        if (selectedMessage && selectedMessage.id === messageId) {
          selectedMessage.status = newStatus;
          selectedMessage.verifiedAt = new Date().toISOString();
        }
        await loadMessages();
        setTimeout(() => { actionAlert = { type: '', text: '' }; }, 3500);
      }
    } catch (e) {
      actionAlert = { type: 'danger', text: e.message || 'Failed to update message status.' };
    } finally {
      actionLoading = false;
    }
  }

  function openMessageDetails(msg) {
    selectedMessage = msg;
    showViewModal = true;
  }

  let filteredMessages = $derived(
    messages.filter(m => {
      const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
      const matchesType = filterType === 'all' || m.messageType === filterType;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (m.userName && m.userName.toLowerCase().includes(q)) ||
        (m.userEmail && m.userEmail.toLowerCase().includes(q)) ||
        (m.subject && m.subject.toLowerCase().includes(q)) ||
        (m.message && m.message.toLowerCase().includes(q));
      return matchesStatus && matchesType && matchesSearch;
    })
  );

  let pendingCount = $derived(messages.filter(m => m.status === 'Pending').length);
  let verifiedCount = $derived(messages.filter(m => m.status === 'Verified').length);
  let rejectedCount = $derived(messages.filter(m => m.status === 'Rejected').length);
</script>

<svelte:head>
  <title>User Messages - SonaInfo Admin</title>
</svelte:head>

<div class="admin-wrapper d-flex">
  <AdminSidebar />

  <div id="content" class="p-4 flex-grow-1">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h2 class="fw-bold mb-0 text-dark font-heading">User Messages</h2>
        <p class="text-muted small mb-0">Review, verify, or reject student inquiries and complaints</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm rounded-pill px-3" onclick={loadMessages} disabled={loading}>
          <i class="bi bi-arrow-clockwise me-1"></i> Refresh
        </button>
      </div>
    </div>

    {#if actionAlert.text}
      <div class="alert alert-{actionAlert.type} alert-dismissible fade show rounded-4 shadow-sm" role="alert">
        <i class="bi bi-{actionAlert.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'} me-2"></i>
        {actionAlert.text}
        <button type="button" class="btn-close" aria-label="Close" onclick={() => actionAlert = { type: '', text: '' }}></button>
      </div>
    {/if}

    <!-- Stat Pill Counters -->
    <div class="row g-3 mb-4">
      <div class="col-md-3 col-6">
        <div class="card border-0 shadow-sm p-3 rounded-4 bg-white text-center">
          <span class="text-muted small fw-semibold">Total Messages</span>
          <h4 class="fw-bold mb-0 text-dark mt-1">{messages.length}</h4>
        </div>
      </div>
      <div class="col-md-3 col-6">
        <div class="card border-0 shadow-sm p-3 rounded-4 bg-white text-center border-start border-warning border-4">
          <span class="text-warning small fw-semibold">Pending Verification</span>
          <h4 class="fw-bold mb-0 text-warning mt-1">{pendingCount}</h4>
        </div>
      </div>
      <div class="col-md-3 col-6">
        <div class="card border-0 shadow-sm p-3 rounded-4 bg-white text-center border-start border-success border-4">
          <span class="text-success small fw-semibold">Verified</span>
          <h4 class="fw-bold mb-0 text-success mt-1">{verifiedCount}</h4>
        </div>
      </div>
      <div class="col-md-3 col-6">
        <div class="card border-0 shadow-sm p-3 rounded-4 bg-white text-center border-start border-danger border-4">
          <span class="text-danger small fw-semibold">Rejected</span>
          <h4 class="fw-bold mb-0 text-danger mt-1">{rejectedCount}</h4>
        </div>
      </div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="card border-0 shadow-sm p-3 rounded-4 bg-white mb-4">
      <div class="row g-2 align-items-center">
        <div class="col-md-4">
          <div class="input-group">
            <span class="input-group-text bg-light border-0"><i class="bi bi-search text-muted"></i></span>
            <input
              type="text"
              class="form-control bg-light border-0"
              placeholder="Search by user, email, subject..."
              bind:value={searchQuery}
            />
          </div>
        </div>
        <div class="col-md-3">
          <select class="form-select bg-light border-0" bind:value={filterStatus}>
            <option value="all">All Verification Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div class="col-md-3">
          <select class="form-select bg-light border-0" bind:value={filterType}>
            <option value="all">All Message Types</option>
            <option value="General Message">General Message</option>
            <option value="Complaint">Complaint</option>
          </select>
        </div>
        <div class="col-md-2 text-md-end">
          <span class="badge bg-secondary bg-opacity-10 text-secondary px-3 py-2 rounded-pill small">
            {filteredMessages.length} Messages
          </span>
        </div>
      </div>
    </div>

    <!-- Messages Table Card -->
    <div class="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
      {#if loading}
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading messages...</span>
          </div>
          <p class="text-muted small mt-2">Loading user messages from Firestore...</p>
        </div>
      {:else if filteredMessages.length === 0}
        <div class="text-center py-5">
          <i class="bi bi-chat-square-dots text-muted display-4"></i>
          <h5 class="mt-3 fw-bold text-dark">No Messages Found</h5>
          <p class="text-muted small mb-0">No submitted user messages match your filters.</p>
        </div>
      {:else}
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light text-muted small text-uppercase">
              <tr>
                <th scope="col" class="ps-4">User</th>
                <th scope="col">Type</th>
                <th scope="col">Subject & Preview</th>
                <th scope="col">Submitted Date</th>
                <th scope="col">Status</th>
                <th scope="col" class="text-end pe-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredMessages as msg}
                <tr>
                  <!-- User Name & Email -->
                  <td class="ps-4">
                    <div class="d-flex align-items-center gap-2">
                      <div class="rounded-circle bg-primary bg-opacity-10 text-primary fw-bold d-flex align-items-center justify-content-center" style="width:36px;height:36px;font-size:0.9rem;flex-shrink:0;">
                        {(msg.userName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong class="text-dark d-block text-truncate" style="max-width:180px;">{msg.userName || 'Anonymous'}</strong>
                        <small class="text-muted d-block text-truncate" style="max-width:180px;">{msg.userEmail || 'N/A'}</small>
                      </div>
                    </div>
                  </td>

                  <!-- Message Type -->
                  <td>
                    {#if msg.messageType === 'Complaint'}
                      <span class="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle rounded-pill px-2 py-1">
                        <i class="bi bi-exclamation-circle me-1"></i> Complaint
                      </span>
                    {:else}
                      <span class="badge bg-info bg-opacity-10 text-info border border-info-subtle rounded-pill px-2 py-1">
                        <i class="bi bi-chat-text me-1"></i> General Message
                      </span>
                    {/if}
                  </td>

                  <!-- Subject & Message Preview -->
                  <td>
                    <div style="max-width: 320px;">
                      <strong class="text-dark d-block text-truncate mb-1">{msg.subject || '(No Subject)'}</strong>
                      <p class="text-muted small mb-0 text-truncate">{msg.message}</p>
                    </div>
                  </td>

                  <!-- Submitted Date -->
                  <td>
                    <span class="small text-muted d-block">
                      <i class="bi bi-calendar3 me-1"></i>{formatDate(msg.createdAt)}
                    </span>
                    {#if msg.verifiedAt}
                      <span class="text-success small d-block" style="font-size:0.75rem;">
                        <i class="bi bi-check-all me-1"></i>Verified: {formatDate(msg.verifiedAt)}
                      </span>
                    {/if}
                  </td>

                  <!-- Verification Status Badge -->
                  <td>
                    {#if msg.status === 'Verified'}
                      <span class="badge bg-success rounded-pill px-3 py-2 fw-semibold">
                        <i class="bi bi-patch-check-fill me-1"></i> Verified
                      </span>
                    {:else if msg.status === 'Rejected'}
                      <span class="badge bg-danger rounded-pill px-3 py-2 fw-semibold">
                        <i class="bi bi-x-circle-fill me-1"></i> Rejected
                      </span>
                    {:else}
                      <span class="badge bg-warning text-dark rounded-pill px-3 py-2 fw-semibold">
                        <i class="bi bi-hourglass-split me-1"></i> Pending
                      </span>
                    {/if}
                  </td>

                  <!-- Admin Actions -->
                  <td class="text-end pe-4">
                    <div class="d-inline-flex gap-1">
                      <button
                        class="btn btn-outline-secondary btn-sm rounded-pill px-2 py-1"
                        title="View Full Message"
                        onclick={() => openMessageDetails(msg)}
                      >
                        <i class="bi bi-eye"></i> View
                      </button>

                      {#if msg.status !== 'Verified'}
                        <button
                          class="btn btn-success btn-sm rounded-pill px-2 py-1"
                          title="Mark as Verified"
                          disabled={actionLoading}
                          onclick={() => handleStatusChange(msg.id, 'Verified')}
                        >
                          <i class="bi bi-check-lg"></i> Verify
                        </button>
                      {/if}

                      {#if msg.status !== 'Rejected'}
                        <button
                          class="btn btn-danger btn-sm rounded-pill px-2 py-1"
                          title="Mark as Rejected"
                          disabled={actionLoading}
                          onclick={() => handleStatusChange(msg.id, 'Rejected')}
                        >
                          <i class="bi bi-x-lg"></i> Reject
                        </button>
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
  </div>
</div>

<!-- View Message Modal -->
{#if showViewModal && selectedMessage}
  <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);" role="dialog">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow-lg rounded-4">
        <div class="modal-header border-0 pb-0 pt-4 px-4">
          <div class="d-flex align-items-center gap-2">
            {#if selectedMessage.messageType === 'Complaint'}
              <span class="badge bg-danger rounded-pill px-3 py-2"><i class="bi bi-exclamation-triangle-fill me-1"></i> Complaint</span>
            {:else}
              <span class="badge bg-info text-white rounded-pill px-3 py-2"><i class="bi bi-chat-text-fill me-1"></i> General Message</span>
            {/if}

            {#if selectedMessage.status === 'Verified'}
              <span class="badge bg-success rounded-pill px-3 py-2"><i class="bi bi-patch-check-fill me-1"></i> Verified</span>
            {:else if selectedMessage.status === 'Rejected'}
              <span class="badge bg-danger rounded-pill px-3 py-2"><i class="bi bi-x-circle-fill me-1"></i> Rejected</span>
            {:else}
              <span class="badge bg-warning text-dark rounded-pill px-3 py-2"><i class="bi bi-hourglass-split me-1"></i> Pending Verification</span>
            {/if}
          </div>
          <button type="button" class="btn-close" aria-label="Close" onclick={() => showViewModal = false}></button>
        </div>

        <div class="modal-body p-4">
          <h4 class="fw-bold text-dark font-heading mb-3">{selectedMessage.subject || '(No Subject)'}</h4>

          <!-- User Details Box -->
          <div class="p-3 bg-light rounded-3 mb-4">
            <div class="row g-2">
              <div class="col-md-6">
                <span class="text-muted small d-block">Submitted By</span>
                <strong class="text-dark">{selectedMessage.userName}</strong>
              </div>
              <div class="col-md-6">
                <span class="text-muted small d-block">Email Address</span>
                <strong class="text-dark">{selectedMessage.userEmail}</strong>
              </div>
              <div class="col-md-6">
                <span class="text-muted small d-block">Submitted At</span>
                <span class="text-dark small"><i class="bi bi-clock me-1"></i>{selectedMessage.createdAt ? new Date(selectedMessage.createdAt).toLocaleString() : 'N/A'}</span>
              </div>
              <div class="col-md-6">
                <span class="text-muted small d-block">User ID</span>
                <span class="text-muted small font-monospace">{selectedMessage.userId}</span>
              </div>
              {#if selectedMessage.verifiedAt}
                <div class="col-12 mt-1">
                  <span class="text-muted small d-block">Verified / Updated At</span>
                  <span class="text-success small"><i class="bi bi-shield-check me-1"></i>{new Date(selectedMessage.verifiedAt).toLocaleString()}</span>
                </div>
              {/if}
            </div>
          </div>

          <!-- Message Content Box -->
          <h6 class="fw-bold text-dark mb-2">Message Content</h6>
          <div class="p-3 rounded-3 border bg-white" style="white-space: pre-wrap; font-size: 0.95rem; line-height: 1.6; max-height: 250px; overflow-y: auto;">
            {selectedMessage.message}
          </div>
        </div>

        <div class="modal-footer border-0 pt-0 pb-4 px-4 justify-content-between">
          <button type="button" class="btn btn-light rounded-pill px-4" onclick={() => showViewModal = false}>
            Close
          </button>
          <div class="d-flex gap-2">
            <button
              class="btn btn-outline-danger rounded-pill px-3"
              disabled={actionLoading || selectedMessage.status === 'Rejected'}
              onclick={() => handleStatusChange(selectedMessage.id, 'Rejected')}
            >
              <i class="bi bi-x-circle me-1"></i> Mark as Rejected
            </button>
            <button
              class="btn btn-success rounded-pill px-3"
              disabled={actionLoading || selectedMessage.status === 'Verified'}
              onclick={() => handleStatusChange(selectedMessage.id, 'Verified')}
            >
              <i class="bi bi-patch-check-fill me-1"></i> Mark as Verified
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .admin-wrapper {
    min-height: 100vh;
    background: #f8fafc;
  }
  #content {
    overflow-x: hidden;
  }
</style>
