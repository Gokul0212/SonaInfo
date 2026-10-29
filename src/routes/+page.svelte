<script>
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { getNewsList } from '$lib/firebaseService.js';
  import { formatDate } from '$lib/stores.js';
  import { onMount } from 'svelte';

  let featuredNews = $state([]);
  let loading = $state(true);

  onMount(async () => {
    try {
      const res = await getNewsList({ limit: 6 });
      if (res.success) {
        featuredNews = res.data;
      }
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>SonaInfo - College Student Information & News Sharing</title>
</svelte:head>

<Navbar />

<!-- Hero Section -->
<header class="hero-section d-flex align-items-center">
  <div class="container">
    <div class="row align-items-center">
      <div class="col-lg-6 hero-content">
        <span class="badge bg-primary mb-3 px-3 py-2 rounded-pill text-uppercase tracking-wider">Campus Information Hub</span>
        <h1 class="hero-title">Stay Connected With Your <span>College</span></h1>
        <p class="hero-subtitle">Discover campus news, events, opportunities, achievements and student updates in one place.</p>
        <div class="d-flex flex-wrap gap-3 mt-4">
          <a href="/news" class="btn btn-primary-custom">Explore Latest News</a>
          <a href="/share-news" class="btn btn-secondary-custom">Share Your News</a>
        </div>
      </div>
      <div class="col-lg-6 d-none d-lg-block position-relative">
        <!-- Logo Collage Graphic -->
        <div class="hero-collage position-relative d-inline-block w-100 text-center">
          <div class="position-absolute top-50 start-50 translate-middle bg-primary rounded-circle filter-blur" style="width: 300px; height: 300px; opacity: 0.15; filter: blur(50px); z-index: 1;"></div>
          <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop&q=60" alt="College Campus" class="collage-main img-fluid rounded-4 shadow-lg border border-secondary position-relative" style="max-height: 380px; object-fit: cover; border-width: 3px !important; z-index: 2;">
          
          <!-- Overlapping brand badge -->
          <div class="collage-badge card border-0 shadow-lg p-3 rounded-4 position-absolute text-start" style="z-index: 10; bottom: -20px; right: 20px; max-width: 250px; background-color: rgba(255, 255, 255, 0.95); backdrop-filter: blur(5px);">
            <div class="d-flex align-items-center gap-3">
              <img src="/uploads/logo.png" alt="Soni Info Logo" class="rounded" style="height: 50px; width: 50px; object-fit: contain; background: #fff;">
              <div>
                <h6 class="fw-bold text-dark mb-0 fs-6">Sona Info Hub</h6>
                <small class="text-primary fw-semibold" style="font-size: 0.75rem;"><i class="bi bi-patch-check-fill me-1"></i>Official Tech Portal</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</header>

<!-- Quick Action Buttons -->
<section class="py-5 bg-white">
  <div class="container">
    <div class="text-center mb-5">
      <h2 class="section-title">Quick Services</h2>
      <p class="text-muted">Navigate instantly to the most important campus updates</p>
    </div>
    <div class="row g-4">
      <!-- Explore News -->
      <div class="col-md-4 col-lg-2 col-6">
        <a href="/news" class="text-decoration-none">
          <div class="quick-action-card">
            <div class="quick-action-icon">
              <i class="bi bi-newspaper"></i>
            </div>
            <h6 class="fw-bold text-dark">Explore News</h6>
          </div>
        </a>
      </div>
      <!-- Share News -->
      <div class="col-md-4 col-lg-2 col-6">
        <a href="/share-news" class="text-decoration-none">
          <div class="quick-action-card">
            <div class="quick-action-icon">
              <i class="bi bi-megaphone"></i>
            </div>
            <h6 class="fw-bold text-dark">Share News</h6>
          </div>
        </a>
      </div>
      <!-- Events -->
      <div class="col-md-4 col-lg-2 col-6">
        <a href="/news?category=Events" class="text-decoration-none">
          <div class="quick-action-card">
            <div class="quick-action-icon">
              <i class="bi bi-calendar-event"></i>
            </div>
            <h6 class="fw-bold text-dark">Events</h6>
          </div>
        </a>
      </div>
      <!-- Placements -->
      <div class="col-md-4 col-lg-2 col-6">
        <a href="/news?category=Placements" class="text-decoration-none">
          <div class="quick-action-card">
            <div class="quick-action-icon">
              <i class="bi bi-briefcase"></i>
            </div>
            <h6 class="fw-bold text-dark">Placements</h6>
          </div>
        </a>
      </div>
      <!-- Achievements -->
      <div class="col-md-4 col-lg-2 col-6">
        <a href="/news?category=Achievements" class="text-decoration-none">
          <div class="quick-action-card">
            <div class="quick-action-icon">
              <i class="bi bi-trophy"></i>
            </div>
            <h6 class="fw-bold text-dark">Achievements</h6>
          </div>
        </a>
      </div>
      <!-- Exam Updates -->
      <div class="col-md-4 col-lg-2 col-6">
        <a href="/news?category=Exam%20Updates" class="text-decoration-none">
          <div class="quick-action-card">
            <div class="quick-action-icon">
              <i class="bi bi-journal-text"></i>
            </div>
            <h6 class="fw-bold text-dark">Exam Updates</h6>
          </div>
        </a>
      </div>
    </div>
  </div>
</section>

<!-- Featured News Section -->
<section class="py-5">
  <div class="container">
    <div class="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-2">
      <div>
        <h2 class="section-title text-start mb-1">Featured Campus News</h2>
        <p class="text-muted mb-0">Verified announcements and updates from college departments</p>
      </div>
      <a href="/news" class="btn btn-outline-primary rounded-pill px-4">View All Updates <i class="bi bi-arrow-right ms-1"></i></a>
    </div>

    {#if loading}
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading news...</span>
        </div>
      </div>
    {:else}
      <div class="row g-4" id="newsGrid">
        {#each featuredNews as item}
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
    {/if}
  </div>
</section>

<Footer />
