<script>
  import AdminSidebar from '$lib/components/AdminSidebar.svelte';
  import { getAllUsers, toggleUserStatus, deleteUser } from '$lib/firebaseService.js';
  import { registerUser } from '$lib/firebaseService.js';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let users = $state([]);
  let loading = $state(true);
  let search = $state('');
  let roleFilter = $state('');
  let showAddModal = $state(false);
  let saving = $state(false);
  let saveError = $state('');
  let saveSuccess = $state('');

  // Add user form
  let newName = $state('');
  let newEmail = $state('');
  let newPassword = $state('');
  let newDepartment = $state('');
  let newYear = $state('');
  let newRole = $state('user');

  onMount(async () => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) { goto('/login?role=admin'); return; }
      const u = JSON.parse(stored);
      if (u.role !== 'admin') { goto('/login?role=admin'); return; }
      await loadUsers();
    } catch (e) { console.error(e); }
  });

  async function loadUsers() {
    loading = true;
    try {
      const res = await getAllUsers();
      if (res.success) users = res.data;
    } catch (e) { console.error(e); }
    finally { loading = false; }
  }

  async function handleToggle(user) {
    const next = user.status === 'active' ? 'disabled' : 'active';
    await toggleUserStatus(user.userId || user.id, next);
    await loadUsers();
  }

  async function handleDelete(id) {
    if (confirm('Are you sure you want to permanently remove this user?')) {
      await deleteUser(id);
      await loadUsers();
    }
  }

  function openAddModal() {
    newName = ''; newEmail = ''; newPassword = ''; newDepartment = ''; newYear = ''; newRole = 'user';
    saveError = ''; saveSuccess = '';
    showAddModal = true;
  }

  async function handleAddUser(e) {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) { saveError = 'Please fill all required fields.'; return; }
    saving = true; saveError = '';
    try {
      const res = await registerUser({ name: newName, email: newEmail, password: newPassword, department: newDepartment, year: newYear, role: newRole });
      if (res.success) {
        if (newRole === 'admin' && res.adminCode) {
          saveSuccess = `Admin registered! Unique Code: ${res.adminCode}`;
        } else {
          saveSuccess = 'User registered successfully!';
        }
        await loadUsers();
        setTimeout(() => { showAddModal = false; saveSuccess = ''; }, 2000);
      }
    } catch (err) {
      saveError = err.message || 'Failed to register user.';
    } finally {
      saving = false;
    }
  }

  let filteredUsers = $derived(users.filter(u => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  }));
</script>

<svelte:head>
  <title>Manage Users - SonaInfo Admin</title>
</svelte:head>

<div class="admin-wrapper d-flex">
  <AdminSidebar />

  <div id="content" class="p-4 flex-grow-1">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h2 class="fw-bold mb-0 text-dark font-heading"><i class="bi bi-people-fill text-primary me-2"></i>User Management</h2>
        <p class="text-muted small mb-0">Monitor and manage registered college user profiles</p>
      </div>
      <button class="btn btn-success rounded-pill px-4 fw-bold" onclick={openAddModal}>
        <i class="bi bi-person-plus-fill me-1"></i> Add New User
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="card border-0 shadow-sm p-3 rounded-4 bg-white mb-4">
      <div class="row g-3 align-items-end">
        <div class="col-md-5">
          <label for="userSearch" class="form-label small fw-bold text-muted">Search Users</label>
          <div class="input-group">
            <span class="input-group-text bg-light"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control bg-light" id="userSearch" bind:value={search} placeholder="Name or email...">
          </div>
        </div>
        <div class="col-md-3">
          <label for="roleFilter" class="form-label small fw-bold text-muted">Role</label>
          <select class="form-select bg-light" id="roleFilter" bind:value={roleFilter}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">Student</option>
          </select>
        </div>
        <div class="col-md-4">
          <div class="d-flex gap-2 align-items-center">
            <span class="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold">
              <i class="bi bi-people me-1"></i> {filteredUsers.length} Users
            </span>
            {#if search || roleFilter}
              <button class="btn btn-light btn-sm rounded-pill px-3" onclick={() => { search = ''; roleFilter = ''; }}>
                <i class="bi bi-x-circle me-1"></i>Clear
              </button>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Management Card -->
    <div class="card border-0 shadow-sm p-4 rounded-4 bg-white">
      {#if loading}
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading users...</span></div>
          <p class="mt-3 text-muted small">Loading user accounts...</p>
        </div>
      {:else if filteredUsers.length === 0}
        <div class="text-center py-5">
          <i class="bi bi-people text-muted display-3"></i>
          <h5 class="mt-3 fw-bold text-dark">No Users Found</h5>
          <p class="text-muted small">{search || roleFilter ? 'Try clearing your filters.' : 'No users have registered yet.'}</p>
          {#if !search && !roleFilter}
            <button class="btn btn-outline-primary rounded-pill px-4 mt-2" onclick={openAddModal}>
              <i class="bi bi-person-plus me-1"></i> Add First User
            </button>
          {/if}
        </div>
      {:else}
        <div class="table-responsive">
          <table class="table align-middle table-hover border-top">
            <thead class="table-light">
              <tr>
                <th scope="col">User</th>
                <th scope="col">Department</th>
                <th scope="col">Year</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">Joined</th>
                <th scope="col" class="text-center" style="min-width: 220px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredUsers as u}
                <tr>
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <div class="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold" style="width:38px;height:38px;font-size:0.9rem;flex-shrink:0;">
                        {(u.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong class="text-dark d-block">{u.name}</strong>
                        <span class="text-muted small">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td><small class="text-secondary">{u.department || 'N/A'}</small></td>
                  <td><small class="text-secondary">{u.year || 'N/A'}</small></td>
                  <td>
                    <span class="badge {u.role === 'admin' ? 'bg-warning text-dark' : 'bg-primary'}">{u.role.toUpperCase()}</span>
                    {#if u.role === 'admin' && u.adminCode}
                      <span class="badge bg-light text-dark border border-warning-subtle font-monospace d-block mt-1 small">
                        {u.adminCode}
                      </span>
                    {/if}
                  </td>
                  <td><span class="badge {u.status === 'active' ? 'bg-success' : 'bg-danger'}">{(u.status || 'active').toUpperCase()}</span></td>
                  <td class="small text-muted">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</td>
                  <td class="text-center">
                    <div class="d-flex justify-content-center gap-2">
                      <button class="btn btn-sm rounded-pill px-3 {u.status === 'active' ? 'btn-outline-warning' : 'btn-outline-success'}" onclick={() => handleToggle(u)} title="{u.status === 'active' ? 'Disable' : 'Enable'} account">
                        <i class="bi bi-{u.status === 'active' ? 'slash-circle' : 'check-circle'} me-1"></i>
                        {u.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                      {#if u.role !== 'admin'}
                        <button class="btn btn-outline-danger btn-sm rounded-pill px-3" aria-label="Delete user" onclick={() => handleDelete(u.userId || u.id)} title="Permanently delete user">
                          <i class="bi bi-trash"></i>
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

<!-- Add User Modal -->
{#if showAddModal}
  <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.6);" role="dialog" aria-modal="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow-lg" style="border-radius: 20px;">
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title fw-bold text-dark"><i class="bi bi-person-plus-fill text-success me-2"></i>Register New User</h5>
          <button type="button" class="btn-close" aria-label="Close" onclick={() => showAddModal = false}></button>
        </div>
        <form onsubmit={handleAddUser}>
          <div class="modal-body py-4">
            {#if saveError}
              <div class="alert alert-danger rounded-3"><i class="bi bi-exclamation-triangle-fill me-2"></i>{saveError}</div>
            {/if}
            {#if saveSuccess}
              <div class="alert alert-success rounded-3"><i class="bi bi-check-circle-fill me-2"></i>{saveSuccess}</div>
            {/if}
            <div class="row g-3">
              <div class="col-md-8">
                <label for="newName" class="form-label fw-bold small">Full Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="newName" bind:value={newName} placeholder="e.g. Jane Doe" required>
              </div>
              <div class="col-md-4">
                <label for="newRole" class="form-label fw-bold small">Role <span class="text-danger">*</span></label>
                <select class="form-select" id="newRole" bind:value={newRole}>
                  <option value="user">Student (User)</option>
                  <option value="admin">Administrator (Admin)</option>
                </select>
              </div>
              <div class="col-md-6">
                <label for="newEmail" class="form-label fw-bold small">Email Address <span class="text-danger">*</span></label>
                <input type="email" class="form-control" id="newEmail" bind:value={newEmail} placeholder="jane@sonainfo.edu" required>
              </div>
              <div class="col-md-6">
                <label for="newPassword" class="form-label fw-bold small">Password <span class="text-danger">*</span></label>
                <input type="password" class="form-control" id="newPassword" bind:value={newPassword} placeholder="Min 6 characters" required minlength="6">
              </div>
              <div class="col-md-6">
                <label for="newDepartment" class="form-label fw-bold small">Department</label>
                <select class="form-select" id="newDepartment" bind:value={newDepartment}>
                  <option value="">Select Department</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Business Administration">Business Administration</option>
                  <option value="Science & Humanities">Science & Humanities</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>
              <div class="col-md-6">
                <label for="newYear" class="form-label fw-bold small">Academic Year</label>
                <select class="form-select" id="newYear" bind:value={newYear}>
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="Faculty">Faculty</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-secondary rounded-pill px-4" onclick={() => showAddModal = false}>Cancel</button>
            <button type="submit" class="btn btn-success rounded-pill px-4 fw-bold" disabled={saving}>
              {#if saving}
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
              {/if}
              {saving ? 'Registering...' : 'Register User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}
