<script>
  import AdminSidebar from '$lib/components/AdminSidebar.svelte';
  import { getCategories, addCategory, updateCategory, deleteCategory } from '$lib/firebaseService.js';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let categories = $state([]);
  let loading = $state(true);
  let isEditing = $state(false);
  let editId = $state(null);
  let name = $state('');
  let description = $state('');
  let saving = $state(false);

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

      await loadCategories();
    } catch (e) {
      console.error(e);
    }
  });

  async function loadCategories() {
    loading = true;
    try {
      const res = await getCategories();
      if (res.success) categories = res.data;
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  function handleEdit(cat) {
    isEditing = true;
    editId = cat.id || cat.categoryId;
    name = cat.name;
    description = cat.description;
  }

  function cancelEdit() {
    isEditing = false;
    editId = null;
    name = '';
    description = '';
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!name) return;
    saving = true;
    try {
      if (isEditing) {
        await updateCategory(editId, name, description);
      } else {
        await addCategory(name, description);
      }
      cancelEdit();
      await loadCategories();
    } catch (err) {
      alert(err.message || 'Error saving category');
    } finally {
      saving = false;
    }
  }

  async function handleDelete(id) {
    if (confirm('Are you sure you want to delete this category?')) {
      await deleteCategory(id);
      await loadCategories();
    }
  }
</script>

<svelte:head>
  <title>Manage Categories - SonaInfo Admin</title>
</svelte:head>

<div class="admin-wrapper d-flex">
  <AdminSidebar />

  <div id="content" class="p-4 flex-grow-1">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h2 class="fw-bold mb-0 text-dark">Category Management</h2>
        <p class="text-muted small mb-0">Create, rename, or delete college news classifications in Firestore</p>
      </div>
    </div>

    <div class="row g-4">
      <!-- Left Side: Table of Categories -->
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm p-4 rounded-4 bg-white">
          {#if loading}
            <div class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading categories...</span>
              </div>
            </div>
          {:else if categories.length === 0}
            <div class="text-center py-5">
              <i class="bi bi-tags text-muted display-3"></i>
              <h5 class="mt-3 fw-bold text-dark">No Categories Found</h5>
            </div>
          {:else}
            <div class="table-responsive">
              <table class="table align-middle table-hover">
                <thead class="table-light">
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Description</th>
                    <th scope="col">Active Usage</th>
                    <th scope="col" class="text-center" style="min-width: 150px;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#each categories as cat}
                    <tr>
                      <td><strong class="text-dark">{cat.name}</strong></td>
                      <td><small class="text-muted">{cat.description || 'No description'}</small></td>
                      <td><span class="badge bg-primary-subtle text-primary">{cat.count || 0} articles</span></td>
                      <td class="text-center">
                        <div class="d-flex justify-content-center gap-2">
                          <button class="btn btn-outline-primary btn-sm rounded-pill px-3" onclick={() => handleEdit(cat)}>
                            <i class="bi bi-pencil"></i> Edit
                          </button>
                          <button class="btn btn-outline-danger btn-sm rounded-pill px-3" aria-label="Delete category" onclick={() => handleDelete(cat.id || cat.categoryId)}>
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

      <!-- Right Side: Add / Edit Form Card -->
      <div class="col-lg-4">
        <div class="card border-0 shadow-sm p-4 rounded-4 bg-white">
          <h5 class="fw-bold text-dark mb-3">{isEditing ? 'Edit Category' : 'Add New Category'}</h5>
          
          <form onsubmit={handleSave}>
            <div class="mb-3">
              <label for="catName" class="form-label small fw-bold">Category Name <span class="text-danger">*</span></label>
              <input type="text" class="form-control" id="catName" bind:value={name} placeholder="e.g. Hackathons" required>
            </div>
            
            <div class="mb-4">
              <label for="catDesc" class="form-label small fw-bold">Description</label>
              <textarea class="form-control" id="catDesc" rows="3" bind:value={description} placeholder="Short summary of this classification..."></textarea>
            </div>

            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-primary-custom flex-grow-1 text-dark fw-bold rounded-3" disabled={saving}>
                {saving ? 'Saving...' : isEditing ? 'Update Category' : 'Add Category'}
              </button>
              {#if isEditing}
                <button type="button" class="btn btn-light rounded-3" onclick={cancelEdit}>Cancel</button>
              {/if}
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>
