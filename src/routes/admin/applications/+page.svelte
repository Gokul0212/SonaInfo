<script>
  import AdminSidebar from '$lib/components/AdminSidebar.svelte';
  import { getAllApplications } from '$lib/firebaseService.js';
  import { formatDate } from '$lib/stores.js';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let applications = $state([]);
  let loading = $state(true);

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

      await loadApplications();
    } catch (e) {
      console.error(e);
    }
  });

  async function loadApplications() {
    loading = true;
    try {
      const res = await getAllApplications();
      if (res.success) applications = res.data;
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Student Applications - SonaInfo Admin</title>
</svelte:head>

<div class="admin-wrapper d-flex">
  <AdminSidebar />

  <div id="content" class="p-4 flex-grow-1">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h2 class="fw-bold mb-0 text-dark">Verified Applications</h2>
        <p class="text-muted small mb-0">Review student applications for Placements and Internships verified via Gmail</p>
      </div>
    </div>

    <!-- Applications Card -->
    <div class="card border-0 shadow-sm p-4 rounded-4 bg-white">
      {#if loading}
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading applications...</span>
          </div>
        </div>
      {:else if applications.length === 0}
        <div class="text-center py-5">
          <i class="bi bi-folder-x text-muted display-3"></i>
          <h5 class="mt-3 fw-bold text-dark">No Applications Found</h5>
          <p class="text-muted small">No students have applied for Placements or Internships yet.</p>
        </div>
      {:else}
        <div class="table-responsive">
          <table class="table align-middle table-hover">
            <thead class="table-light">
              <tr>
                <th scope="col" style="min-width: 250px;">Position / Posting Title</th>
                <th scope="col">Applicant Name</th>
                <th scope="col">Gmail Address</th>
                <th scope="col">Applied Date</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {#each applications as app}
                <tr>
                  <td><strong class="text-dark">{app.newsTitle}</strong></td>
                  <td><span class="text-secondary small fw-semibold">{app.studentName}</span></td>
                  <td><span class="text-muted small">{app.studentEmail}</span></td>
                  <td class="small text-muted">{formatDate(app.createdAt)}</td>
                  <td>
                    {#if app.status === 'verified'}
                      <span class="badge bg-success"><i class="bi bi-patch-check-fill me-1"></i>Verified</span>
                    {:else}
                      <span class="badge bg-warning text-dark"><i class="bi bi-hourglass-split me-1"></i>Pending Code</span>
                    {/if}
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
