<script>
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { getNewsList, getCategories } from '$lib/firebaseService.js';
  import { formatDate } from '$lib/stores.js';
  import { page } from '$app/state';
  import { onMount } from 'svelte';

  let newsList = $state([]);
  let categories = $state([]);
  let search = $state('');
  let selectedCategory = $state('');
  let sort = $state('newest');
  let currentPage = $state(1);
  let totalPages = $state(1);
  let totalResults = $state(0);
  let loading = $state(true);
  let showCategoriesFocus = $state(false);

  onMount(async () => {
    const catParam = page.url.searchParams.get('category');
    const searchParam = page.url.searchParams.get('search');
    const focusParam = page.url.searchParams.get('focus');

    if (catParam) selectedCategory = catParam;
    if (searchParam) search = searchParam;
    if (focusParam === 'categories') showCategoriesFocus = true;

    try {
      const catRes = await getCategories();
      if (catRes.success) categories = catRes.data;
    } catch (e) {}

    await fetchNews(1);
  });

  async function fetchNews(pageNum = 1) {
    loading = true;
    currentPage = pageNum;
    try {
      const res = await getNewsList({
        search,
        category: selectedCategory,
        sort,
        page: pageNum,
        limit: 6,
        status: 'approved'
      });
      if (res.success) {
        newsList = res.data;
        totalPages = res.pagination.totalPages;
        totalResults = res.pagination.totalResults;
      }
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  function handleFilterSubmit(e) {
    e.preventDefault();
    fetchNews(1);
  }

  function resetFilters() {
    search = '';
    selectedCategory = '';
    sort = 'newest';
    fetchNews(1);
  }

  function selectCategoryFocus(catName) {
    selectedCategory = catName;
    fetchNews(1);
  }
</script>

<svelte:head>
  <title>Latest News - SonaInfo</title>
</svelte:head>

<Navbar />

<!-- News Feed Header -->
<header class="py-5 bg-dark text-white text-center" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
  <div class="container">
    <h1 class="fw-bold mb-2">Latest News</h1>
    <p class="text-muted mb-0">Explore the latest updates from your college community.</p>
  </div>
</header>

<!-- Search & Filters -->
<section class="container my-4">
  <div class="card border-0 shadow-sm p-3 rounded-4 bg-white">
    <form onsubmit={handleFilterSubmit}>
      <div class="row g-3">
        <!-- Search box -->
        <div class="col-md-4">
          <label for="searchInput" class="form-label small fw-bold text-muted">Search Keyword</label>
          <div class="input-group">
            <span class="input-group-text bg-light"><i class="bi bi-search"></i></span>
            <input type="text" class="form-control bg-light" id="searchInput" bind:value={search} placeholder="Search title or description...">
          </div>
        </div>

        <!-- Category dropdown -->
        <div class="col-md-3">
          <label for="categoryFilter" class="form-label small fw-bold text-muted">Category</label>
          <select class="form-select bg-light" id="categoryFilter" bind:value={selectedCategory}>
            <option value="">All Categories</option>
            {#each categories as cat}
              <option value={cat.name}>{cat.name}</option>
            {/each}
          </select>
        </div>

        <!-- Sort dropdown -->
        <div class="col-md-3">
          <label for="sortFilter" class="form-label small fw-bold text-muted">Sort By</label>
          <select class="form-select bg-light" id="sortFilter" bind:value={sort}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="eventDate_asc">Event Date (Soonest)</option>
            <option value="eventDate_desc">Event Date (Latest)</option>
          </select>
        </div>

        <!-- Actions -->
        <div class="col-md-2 d-flex align-items-end gap-2">
          <button type="submit" class="btn btn-primary-custom w-100 fw-bold text-dark rounded-3">Search</button>
          <button type="button" class="btn btn-light rounded-3 px-3" onclick={resetFilters} title="Reset Filters"><i class="bi bi-arrow-counterclockwise"></i></button>
        </div>
      </div>
    </form>
  </div>
</section>

<!-- News Collection -->
<section class="container my-4 pb-5">
  <!-- Categories Focus Grid -->
  {#if showCategoriesFocus}
    <div class="mb-4">
      <h4 class="fw-bold mb-3"><i class="bi bi-tags text-primary me-2"></i>Browse by Category</h4>
      <div class="row g-3">
        {#each categories as cat}
          <div class="col-md-4 col-sm-6">
            <div class="card p-3 rounded-4 border-0 shadow-sm category-card h-100 cursor-pointer" role="button" tabindex="0" onclick={() => selectCategoryFocus(cat.name)} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectCategoryFocus(cat.name)}>
              <h6 class="fw-bold text-dark mb-1">{cat.name}</h6>
              <p class="small text-muted mb-2">{cat.description}</p>
              <span class="badge bg-primary-subtle text-primary align-self-start">{cat.count || 0} Articles</span>
            </div>
          </div>
        {/each}
      </div>
      <hr class="my-4">
    </div>
  {/if}

  <!-- Feed Results -->
  <h4 class="fw-bold mb-4">
    {#if selectedCategory}
      {selectedCategory} Articles
    {:else if search}
      Search Results for "{search}"
    {:else}
      All Articles
    {/if}
  </h4>

  {#if loading}
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading news...</span>
      </div>
    </div>
  {:else if newsList.length === 0}
    <div class="text-center py-5 bg-white rounded-4 border">
      <i class="bi bi-search-heart text-muted display-3"></i>
      <h5 class="mt-3 fw-bold text-dark">No News Found Matching Your Search</h5>
      <p class="text-muted small">Try modifying keywords, changing categories, or clearing filters.</p>
      <button onclick={resetFilters} class="btn btn-primary-custom btn-sm text-dark px-4 rounded-pill mt-2">Clear Search Filters</button>
    </div>
  {:else}
    <div class="row g-4 mb-4">
      {#each newsList as item}
        <div class="col-md-6 col-lg-4">
          <div class="news-card">
            <div class="news-img-wrapper">
              <span class="category-badge">{item.category}</span>
              <img src={item.imageUrl || '/uploads/logo.png'} class="news-img" alt={item.title} onerror={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&auto=format&fit=crop&q=60'; }}>
            </div>
            <div class="news-body">
              <h5 class="news-title" title={item.title}>{item.title}</h5>
              <p class="news-snippet">{item.description}</p>
              <div class="news-footer">
                <span class="news-date"><i class="bi bi-calendar3 me-1"></i>{formatDate(item.createdAt)}</span>
                <a href="/news/{item.id || item._id}" class="btn-read-more">Read More <i class="bi bi-arrow-right"></i></a>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <nav aria-label="News pagination">
        <ul class="pagination justify-content-center">
          <li class="page-item {currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link" onclick={() => fetchNews(currentPage - 1)}>Previous</button>
          </li>
          {#each Array(totalPages) as _, idx}
            <li class="page-item {currentPage === idx + 1 ? 'active' : ''}">
              <button class="page-link" onclick={() => fetchNews(idx + 1)}>{idx + 1}</button>
            </li>
          {/each}
          <li class="page-item {currentPage === totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick={() => fetchNews(currentPage + 1)}>Next</button>
          </li>
        </ul>
      </nav>
    {/if}
  {/if}
</section>

<Footer />
