<script>
  import AdminSidebar from '$lib/components/AdminSidebar.svelte';
  import { getNewsList, getAllUsers, getAllApplications, getAllUserMessages } from '$lib/firebaseService.js';
  import { formatDate } from '$lib/stores.js';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let stats = $state({ totalUsers: 0, totalNews: 0, pendingReview: 0, published: 0, totalApps: 0, rejected: 0, totalMessages: 0, pendingMessages: 0 });
  let pendingArticles = $state([]);
  let recentNews = $state([]);
  let loading = $state(true);
  let adminUser = $state(null);

  onMount(async () => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) { goto('/login?role=admin'); return; }
      adminUser = JSON.parse(stored);
      if (adminUser.role !== 'admin') { goto('/login?role=admin'); return; }

      const [newsRes, usersRes, appsRes, msgsRes] = await Promise.all([
        getNewsList({ limit: 200, status: '' }),
        getAllUsers(),
        getAllApplications(),
        getAllUserMessages()
      ]);

      const allNews = newsRes.data || [];
      const allMsgs = msgsRes.data || [];
      stats.totalUsers = (usersRes.data || []).length;
      stats.totalNews = allNews.length;
      stats.pendingReview = allNews.filter(n => n.status === 'pending').length;
      stats.published = allNews.filter(n => n.status === 'approved').length;
      stats.rejected = allNews.filter(n => n.status === 'rejected').length;
      stats.totalApps = (appsRes.data || []).length;
      stats.totalMessages = allMsgs.length;
      stats.pendingMessages = allMsgs.filter(m => m.status === 'Pending').length;

      pendingArticles = allNews.filter(n => n.status === 'pending').slice(0, 5);
      recentNews = allNews.filter(n => n.status === 'approved').slice(0, 4);
    } catch (e) { console.error(e); }
    finally { loading = false; }
  });
</script>

<svelte:head>
  <title>Admin Dashboard - SonaInfo</title>
</svelte:head>

<div class="admin-wrapper d-flex">
  <AdminSidebar />

  <div id="content" class="p-4 flex-grow-1">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <h2 class="fw-bold mb-0 text-dark font-heading">Admin Dashboard</h2>
          {#if adminUser?.adminCode}
            <span class="badge bg-warning text-dark border border-warning px-2.5 py-1 rounded-pill fw-bold font-monospace shadow-sm" title="Unique Admin Identification Code">
              <i class="bi bi-shield-check me-1"></i>{adminUser.adminCode}
            </span>
          {/if}
        </div>
        <p class="text-muted small mb-0">Welcome back, <strong>{adminUser?.name || 'Admin'}</strong> — Here's your campus portal overview</p>
      </div>
      <div class="d-flex align-items-center gap-2">
        <a href="/admin/news" class="btn btn-primary-custom btn-sm rounded-pill px-3 fw-bold text-dark">
          <i class="bi bi-plus-circle me-1"></i> Add Official News
        </a>
        <a href="/admin/messages" class="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold">
          <i class="bi bi-chat-left-text me-1"></i> Messages {stats.pendingMessages > 0 ? `(${stats.pendingMessages})` : ''}
        </a>
        <a href="/admin/pending" class="btn btn-warning btn-sm rounded-pill px-3 fw-bold text-dark">
          <i class="bi bi-clock-history me-1"></i> Review {stats.pendingReview > 0 ? `(${stats.pendingReview})` : ''}
        </a>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="row g-3 mb-4">
      <div class="col-lg-2 col-md-4 col-6">
        <a href="/admin/users" class="text-decoration-none">
          <div class="stat-card-modern h-100 d-flex flex-column align-items-center text-center gap-2 py-3 hover-shadow">
            <div class="stat-icon-wrapper bg-primary bg-opacity-10 text-primary"><i class="bi bi-people"></i></div>
            <div>
              <h3 class="stat-number mb-0">{stats.totalUsers}</h3>
              <span class="text-muted small fw-semibold d-block">Users</span>
            </div>
          </div>
        </a>
      </div>
      <div class="col-lg-2 col-md-4 col-6">
        <a href="/admin/news" class="text-decoration-none">
          <div class="stat-card-modern h-100 d-flex flex-column align-items-center text-center gap-2 py-3 hover-shadow">
            <div class="stat-icon-wrapper bg-info bg-opacity-10 text-info"><i class="bi bi-newspaper"></i></div>
            <div>
              <h3 class="stat-number mb-0">{stats.totalNews}</h3>
              <span class="text-muted small fw-semibold d-block">Total Articles</span>
            </div>
          </div>
        </a>
      </div>
      <div class="col-lg-2 col-md-4 col-6">
        <a href="/admin/news" class="text-decoration-none">
          <div class="stat-card-modern h-100 d-flex flex-column align-items-center text-center gap-2 py-3 hover-shadow">
            <div class="stat-icon-wrapper bg-success bg-opacity-10 text-success"><i class="bi bi-check-circle"></i></div>
            <div>
              <h3 class="stat-number mb-0">{stats.published}</h3>
              <span class="text-muted small fw-semibold d-block">Published</span>
            </div>
          </div>
        </a>
      </div>
      <div class="col-lg-2 col-md-4 col-6">
        <a href="/admin/pending" class="text-decoration-none">
          <div class="stat-card-modern h-100 d-flex flex-column align-items-center text-center gap-2 py-3 hover-shadow" style="border-color: var(--bs-warning);">
            <div class="stat-icon-wrapper bg-warning bg-opacity-10 text-warning"><i class="bi bi-clock-history"></i></div>
            <div>
              <h3 class="stat-number mb-0 text-warning">{stats.pendingReview}</h3>
              <span class="text-muted small fw-semibold d-block">Pending News</span>
            </div>
          </div>
        </a>
      </div>
      <div class="col-lg-2 col-md-4 col-6">
        <a href="/admin/messages" class="text-decoration-none">
          <div class="stat-card-modern h-100 d-flex flex-column align-items-center text-center gap-2 py-3 hover-shadow" style={stats.pendingMessages > 0 ? "border-color: var(--bs-primary);" : ""}>
            <div class="stat-icon-wrapper bg-primary bg-opacity-10 text-primary"><i class="bi bi-chat-left-dots"></i></div>
            <div>
              <h3 class="stat-number mb-0 text-primary">{stats.totalMessages}</h3>
              <span class="text-muted small fw-semibold d-block">User Messages</span>
            </div>
          </div>
        </a>
      </div>
      <div class="col-lg-2 col-md-4 col-6">
        <a href="/admin/applications" class="text-decoration-none">
          <div class="stat-card-modern h-100 d-flex flex-column align-items-center text-center gap-2 py-3 hover-shadow">
            <div class="stat-icon-wrapper bg-purple bg-opacity-10" style="background: rgba(139,92,246,0.1); color: #8b5cf6;"><i class="bi bi-briefcase"></i></div>
            <div>
              <h3 class="stat-number mb-0">{stats.totalApps}</h3>
              <span class="text-muted small fw-semibold d-block">Applications</span>
            </div>
          </div>
        </a>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="row g-4 mb-4">
      <!-- Pending Articles Panel -->
      <div class="col-md-7">
        <div class="card border-0 shadow-sm p-4 rounded-4 bg-white h-100">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-bold mb-0 text-dark"><i class="bi bi-clock-history text-warning me-2"></i>Pending Reviews</h5>
            <a href="/admin/pending" class="btn btn-sm btn-outline-warning rounded-pill px-3">View All</a>
          </div>
          {#if loading}
            <div class="text-center py-4"><div class="spinner-border spinner-border-sm text-warning"></div></div>
          {:else if pendingArticles.length === 0}
            <div class="text-center py-4">
              <i class="bi bi-patch-check text-muted display-4"></i>
              <p class="text-muted small mt-2 mb-0">All caught up! No pending submissions.</p>
            </div>
          {:else}
            <ul class="list-group list-group-flush">
              {#each pendingArticles as p}
                <li class="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                  <div class="d-flex align-items-center gap-3">
                    <img src={p.imageUrl || '/uploads/logo.png'} alt="thumb" class="rounded-3" style="width:40px;height:40px;object-fit:cover;flex-shrink:0;"
                      onerror={(e) => { e.currentTarget.src = '/uploads/logo.png'; }}>
                    <div>
                      <strong class="text-dark d-block" style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{p.title}</strong>
                      <small class="text-muted">{p.authorName} • {formatDate(p.createdAt)}</small>
                    </div>
                  </div>
                  <a href="/admin/pending" class="btn btn-sm btn-primary-custom text-dark rounded-pill px-3">Review</a>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>

      <!-- Quick Management Panel -->
      <div class="col-md-5">
        <div class="card border-0 shadow-sm p-4 rounded-4 bg-white h-100">
          <h5 class="fw-bold mb-3 text-dark"><i class="bi bi-gear-fill text-primary me-2"></i>Management Shortcuts</h5>
          <div class="row g-3">
            {#each [
              { href: '/admin/news', icon: 'bi-newspaper', label: 'Manage News', color: 'primary' },
              { href: '/admin/pending', icon: 'bi-clock-history', label: 'Pending Review', color: 'warning' },
              { href: '/admin/categories', icon: 'bi-tags', label: 'Categories', color: 'info' },
              { href: '/admin/users', icon: 'bi-people', label: 'User Profiles', color: 'success' },
              { href: '/admin/applications', icon: 'bi-briefcase', label: 'Applications', color: 'danger' },
              { href: '/share-news', icon: 'bi-megaphone', label: 'Post News', color: 'secondary' }
            ] as s}
              <div class="col-6">
                <a href={s.href} class="card p-3 text-decoration-none border rounded-3 bg-light text-center h-100 hover-shadow">
                  <i class="bi {s.icon} fs-3 text-{s.color} mb-1 d-block"></i>
                  <span class="fw-bold text-dark small">{s.label}</span>
                </a>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Published News -->
    {#if recentNews.length > 0}
      <div class="card border-0 shadow-sm p-4 rounded-4 bg-white">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-bold mb-0 text-dark"><i class="bi bi-newspaper text-success me-2"></i>Recently Published</h5>
          <a href="/admin/news" class="btn btn-sm btn-outline-success rounded-pill px-3">Manage All</a>
        </div>
        <div class="row g-3">
          {#each recentNews as item}
            <div class="col-md-3 col-sm-6">
              <div class="card border-0 rounded-3 overflow-hidden shadow-sm h-100">
                <img src={item.imageUrl || '/uploads/logo.png'} alt={item.title} style="height:120px;object-fit:cover;"
                  onerror={(e) => { e.currentTarget.src = '/uploads/logo.png'; }}>
                <div class="p-2">
                  <span class="badge bg-secondary small mb-1">{item.category}</span>
                  <p class="small fw-bold text-dark mb-1" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title={item.title}>{item.title}</p>
                  <small class="text-muted">{formatDate(item.createdAt)}</small>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>
