<script>
  import { theme } from '$lib/stores.js';
  import { userProfile, logoutUser } from '$lib/firebaseService.js';
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  let user = $state(null);

  // Properly subscribe with cleanup to avoid memory leaks and stale state
  const unsubscribe = userProfile.subscribe(val => {
    user = val;
  });

  onMount(() => {
    theme.init();
    // Restore user session from localStorage on page load
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        // Only set if userProfile store is not already populated
        userProfile.update(current => current ?? u);
      }
    } catch (e) {}
  });

  onDestroy(() => {
    unsubscribe();
  });

  async function handleSignOut() {
    await logoutUser();
    goto('/login');
  }

  function handleLoginClick(e) {
    e.preventDefault();
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && u.role) {
          goto(u.role === 'admin' ? '/admin/dashboard' : '/dashboard');
          return;
        }
      }
    } catch (_) {}
    goto('/login');
  }

  function handleAdminClick(e) {
    e.preventDefault();
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && u.role === 'admin') {
          goto('/admin/dashboard');
          return;
        }
      }
    } catch (_) {}
    goto('/login?role=admin');
  }
</script>

<nav class="navbar navbar-expand-lg navbar-dark sticky-top">
  <div class="container">
    <a class="navbar-brand d-flex align-items-center" href="/">
      <img src="/uploads/logo.png" alt="SonaInfo Logo" height="35" class="me-2 rounded-circle bg-white p-1">
      <span class="font-heading">Sona<span class="text-warning">Info</span></span>
    </a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav mx-auto">
        <li class="nav-item">
          <a class="nav-link {page.url.pathname === '/' ? 'active' : ''}" href="/">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link {page.url.pathname === '/news' ? 'active' : ''}" href="/news">Latest News</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/news?focus=categories">Categories</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#aboutModal" data-bs-toggle="modal" data-bs-target="#aboutModal">About</a>
        </li>
      </ul>
      <div class="d-flex align-items-center gap-2" id="navAuthSection">
        <!-- Theme Toggle Button -->
        <button class="theme-switch-btn theme-toggle-btn shadow-sm me-1" onclick={() => theme.toggle()} title="Switch Day/Night Mode">
          {#if $theme === 'dark'}
            <i class="bi bi-moon-stars-fill theme-icon-moon"></i> <span>Night</span>
          {:else}
            <i class="bi bi-sun-fill theme-icon-sun"></i> <span>Day</span>
          {/if}
        </button>

        {#if user}
          {#if user.role === 'admin'}
            <a href="/admin/dashboard" class="btn btn-warning btn-sm px-3 rounded-pill fw-bold">
              <i class="bi bi-speedometer2 me-1"></i> Admin Panel
            </a>
          {:else}
            <a href="/dashboard" class="btn btn-outline-light btn-sm px-3 rounded-pill">
              <i class="bi bi-speedometer2 me-1"></i> Dashboard
            </a>
            <a href="/share-news" class="btn btn-primary-custom btn-sm px-3 text-dark rounded-pill">
              <i class="bi bi-pencil-square me-1"></i> Share News
            </a>
          {/if}
          <button onclick={handleSignOut} class="btn btn-outline-danger btn-sm px-3 rounded-pill">
            <i class="bi bi-box-arrow-right me-1"></i> Logout
          </button>
        {:else}
          <a href="/login" onclick={handleLoginClick} class="btn btn-outline-light btn-sm px-3 rounded-pill"><i class="bi bi-person-circle me-1"></i>Login</a>
          <a href="/register" class="btn btn-glitter-glow btn-sm px-3 text-dark rounded-pill">
            <i class="bi bi-stars"></i><span>Register</span>
          </a>
          <a href="/login?role=admin" onclick={handleAdminClick} class="btn btn-outline-warning btn-sm px-3 rounded-pill"><i class="bi bi-shield-lock-fill me-1"></i>Admin</a>
        {/if}
      </div>
    </div>
  </div>
</nav>

<!-- About Modal -->
<div class="modal fade" id="aboutModal" tabindex="-1" aria-labelledby="aboutModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0 shadow-lg rounded-4">
      <div class="modal-header border-0 pb-0">
        <h5 class="modal-title fw-bold" id="aboutModalLabel">About SonaInfo</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body py-4 text-center">
        <img src="/uploads/logo.png" alt="SonaInfo" height="70" class="mb-3 rounded bg-light p-1 shadow-sm">
        <h4 class="fw-bold text-dark mb-2">SonaInfo Portal</h4>
        <p class="text-muted small mb-3">Campus Student Information & News Sharing Platform</p>
        <div class="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill mb-3">
          Powered by SvelteKit + Bootstrap 5 + Firebase
        </div>
        <p class="text-secondary small">
          SonaInfo connects college students, faculty, and departments through real-time notifications, placement opportunities, verified event notices, and dynamic student contributions.
        </p>
      </div>
      <div class="modal-footer border-0 pt-0">
        <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>
