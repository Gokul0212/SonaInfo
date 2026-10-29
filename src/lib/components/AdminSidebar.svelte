<script>
  import { page } from '$app/state';
  import { logoutUser } from '$lib/firebaseService.js';
  import { theme } from '$lib/stores.js';
  import { goto } from '$app/navigation';

  let currentPath = $derived(page.url.pathname);

  async function handleLogout() {
    await logoutUser();
    goto('/login');
  }
</script>

<nav id="sidebar">
  <div class="sidebar-header d-flex align-items-center gap-3">
    <img src="/uploads/logo.png" alt="Logo" class="brand-logo-img">
    <div>
      <h5 class="fw-bold mb-0 text-white font-heading">Sona<span class="text-warning">Info</span></h5>
      <span class="text-warning small text-uppercase fw-bold" style="font-size: 0.65rem; letter-spacing: 1px;">Admin Console</span>
    </div>
  </div>

  <div class="px-3 pt-3">
    <button class="theme-switch-btn theme-toggle-btn w-100 justify-content-center mb-2" onclick={() => theme.toggle()}>
      {#if $theme === 'dark'}
        <i class="bi bi-moon-stars-fill theme-icon-moon"></i> <span>Night Mode</span>
      {:else}
        <i class="bi bi-sun-fill theme-icon-sun"></i> <span>Day Mode</span>
      {/if}
    </button>
  </div>

  <ul class="list-unstyled components">
    <li class={currentPath === '/admin/dashboard' ? 'active' : ''}>
      <a href="/admin/dashboard"><i class="bi bi-speedometer2"></i> Dashboard</a>
    </li>
    <li class={currentPath === '/admin/pending' ? 'active' : ''}>
      <a href="/admin/pending"><i class="bi bi-clock-history"></i> Pending Review</a>
    </li>
    <li class={currentPath === '/admin/news' ? 'active' : ''}>
      <a href="/admin/news"><i class="bi bi-newspaper"></i> All News</a>
    </li>
    <li class={currentPath === '/admin/categories' ? 'active' : ''}>
      <a href="/admin/categories"><i class="bi bi-tags"></i> Categories</a>
    </li>
    <li class={currentPath === '/admin/users' ? 'active' : ''}>
      <a href="/admin/users"><i class="bi bi-people"></i> Users</a>
    </li>
    <li class={currentPath === '/admin/applications' ? 'active' : ''}>
      <a href="/admin/applications"><i class="bi bi-briefcase"></i> Applications</a>
    </li>
    <li class={currentPath === '/admin/messages' ? 'active' : ''}>
      <a href="/admin/messages"><i class="bi bi-chat-left-text"></i> User Messages</a>
    </li>
    <li class="mt-4 border-top border-secondary pt-3">
      <a href="/" target="_blank"><i class="bi bi-globe"></i> View Live Site</a>
    </li>
    <li>
      <a href="#logout" onclick={(e) => { e.preventDefault(); handleLogout(); }}><i class="bi bi-box-arrow-right"></i> Logout</a>
    </li>
  </ul>
</nav>

<style>
  #sidebar {
    min-width: 250px;
    max-width: 250px;
    background: #0f172a;
    color: #fff;
    transition: all 0.3s;
    border-right: 2px solid #1e293b;
    min-height: 100vh;
  }
  #sidebar .sidebar-header {
    padding: 20px;
    background: #090d16;
    border-bottom: 1px solid #1e293b;
  }
  #sidebar ul.components {
    padding: 20px 0;
  }
  #sidebar ul li {
    padding: 5px 20px;
  }
  #sidebar ul li a {
    padding: 10px 15px;
    font-size: 0.95rem;
    display: block;
    color: #94a3b8;
    text-decoration: none;
    font-weight: 500;
    border-radius: 8px;
    transition: all 0.3s;
  }
  #sidebar ul li a:hover, #sidebar ul li.active a {
    color: #fff;
    background: #1e293b;
  }
  #sidebar ul li a i {
    margin-right: 10px;
    font-size: 1.1rem;
  }
  @media (max-width: 768px) {
    #sidebar {
      min-width: 100%;
      max-width: 100%;
      min-height: auto;
    }
  }
</style>
