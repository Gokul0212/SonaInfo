<script>
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { getNewsDetail, applyForPosting, verifyApplication } from '$lib/firebaseService.js';
  import { formatDate } from '$lib/stores.js';
  import { page } from '$app/state';
  import { onMount } from 'svelte';

  let article = $state(null);
  let relatedNews = $state([]);
  let loading = $state(true);
  let errorMsg = $state('');
  
  // Application flow states
  let applying = $state(false);
  let showCodeModal = $state(false);
  let applicationId = $state('');
  let receivedCode = $state('');
  let inputCode = $state('');
  let verifySuccessMsg = $state('');
  let verifyErrorMsg = $state('');
  let verifying = $state(false);
  let currentUserObj = $state(null);

  let id = $derived(page.params.id);

  onMount(async () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) currentUserObj = JSON.parse(stored);
    } catch (e) {}

    await loadArticle();
  });

  async function loadArticle() {
    loading = true;
    errorMsg = '';
    try {
      const res = await getNewsDetail(id);
      if (res.success) {
        article = res.data;
        relatedNews = res.related;
      }
    } catch (e) {
      errorMsg = e.message || 'Article not found';
    } finally {
      loading = false;
    }
  }

  async function handleApply() {
    if (!currentUserObj) {
      window.location.href = '/login';
      return;
    }
    applying = true;
    try {
      const res = await applyForPosting(article.id || article._id, currentUserObj);
      if (res.success) {
        applicationId = res.data.applicationId;
        receivedCode = res.data.code;
        showCodeModal = true;
      }
    } catch (err) {
      alert(err.message || 'Application failed');
    } finally {
      applying = false;
    }
  }

  async function handleVerify() {
    if (!inputCode) return;
    verifying = true;
    verifyErrorMsg = '';
    try {
      const res = await verifyApplication(applicationId, inputCode);
      if (res.success) {
        verifySuccessMsg = res.message;
        setTimeout(() => {
          showCodeModal = false;
        }, 2000);
      }
    } catch (e) {
      verifyErrorMsg = e.message || 'Invalid verification code';
    } finally {
      verifying = false;
    }
  }
</script>

<svelte:head>
  <title>{article ? article.title : 'News Article'} - SonaInfo</title>
</svelte:head>

<Navbar />

{#if loading}
  <div class="loader-container bg-white border-bottom py-5 text-center">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading article...</span>
    </div>
  </div>
{:else if errorMsg}
  <div class="container my-5 text-center py-5">
    <i class="bi bi-exclamation-circle text-danger display-3"></i>
    <h4 class="mt-3 fw-bold">{errorMsg}</h4>
    <a href="/news" class="btn btn-outline-primary rounded-pill px-4 mt-3">Back to News</a>
  </div>
{:else if article}
  <main class="container my-5">
    <div class="row g-5">
      <!-- Left Column: News Body -->
      <div class="col-lg-8">
        <!-- Breadcrumb & Category -->
        <div class="d-flex align-items-center gap-2 mb-3">
          <a href="/news" class="text-decoration-none small text-muted">News</a>
          <span class="text-muted small">/</span>
          <span class="badge bg-primary px-3 py-1.5 rounded-pill text-uppercase">{article.category}</span>
        </div>

        <h1 class="fw-bold text-dark mb-3 lh-base">{article.title}</h1>
        
        <!-- Meta details -->
        <div class="d-flex align-items-center gap-3 text-muted small border-bottom pb-3 mb-4 flex-wrap">
          <span><i class="bi bi-person-circle text-primary me-1 fs-6"></i>Published by <strong class="text-dark">{article.authorName}</strong></span>
          <span><i class="bi bi-calendar3 me-1"></i><span>{formatDate(article.createdAt)}</span></span>
        </div>

        <!-- Featured Image -->
        <div class="mb-4 rounded-4 overflow-hidden shadow-sm bg-light" style="max-height: 450px;">
          <img src={article.imageUrl || '/uploads/logo.png'} class="img-fluid w-100" style="object-fit: cover; max-height: 450px;" alt={article.title} onerror={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&auto=format&fit=crop&q=60'; }}>
        </div>

        <!-- Event details box -->
        {#if article.eventDate || article.location}
          <div class="card border-0 bg-light p-3 rounded-4 mb-4">
            <h6 class="fw-bold text-primary mb-2"><i class="bi bi-info-circle-fill me-1"></i>Event & Schedule Details</h6>
            <div class="row g-2 small">
              {#if article.eventDate}
                <div class="col-sm-6">
                  <i class="bi bi-calendar-event me-2"></i>Date: <strong>{formatDate(article.eventDate)}</strong>
                </div>
              {/if}
              {#if article.location}
                <div class="col-sm-6">
                  <i class="bi bi-geo-alt me-2"></i>Location: <strong>{article.location}</strong>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Full Description -->
        <article class="lh-lg text-secondary mb-5" style="font-size: 1.05rem; white-space: pre-wrap;">
          {article.description}
        </article>

        <!-- Source citation -->
        {#if article.source}
          <div class="card border-0 bg-light p-3 rounded-4 mb-4">
            <span class="small text-muted"><i class="bi bi-link-45deg me-1"></i>Reference / Source Link: <span class="fw-bold">{article.source}</span></span>
          </div>
        {/if}

        <!-- Back to News & Apply Actions -->
        <div class="mt-5 border-top pt-4 d-flex gap-3 align-items-center flex-wrap">
          <a href="/news" class="btn btn-outline-secondary rounded-pill px-4"><i class="bi bi-arrow-left me-2"></i>Back to News</a>
          {#if article.category === 'Placements' || article.category === 'Internships'}
            <button onclick={handleApply} class="btn btn-glitter-glow px-4 py-2" disabled={applying}>
              <i class="bi bi-send-fill me-1"></i> {applying ? 'Processing...' : 'Apply via Gmail'}
            </button>
          {/if}
        </div>
      </div>

      <!-- Right Column: Related News -->
      <div class="col-lg-4">
        <h4 class="fw-bold mb-4">Related News</h4>
        <div class="d-flex flex-column gap-4">
          {#each relatedNews as rel}
            <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
              <img src={rel.imageUrl || '/uploads/logo.png'} class="card-img-top" style="height: 160px; object-fit: cover;" alt={rel.title} onerror={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&auto=format&fit=crop&q=60'; }}>
              <div class="card-body p-3">
                <span class="badge bg-secondary mb-2">{rel.category}</span>
                <h6 class="fw-bold text-dark mb-2">{rel.title}</h6>
                <a href="/news/{rel.id || rel._id}" class="btn-read-more small">Read More <i class="bi bi-arrow-right"></i></a>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </main>
{/if}

<!-- Mock Gmail Verification Modal -->
{#if showCodeModal}
  <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.6);" role="dialog">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg rounded-4">
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title fw-bold text-dark"><i class="bi bi-envelope-check text-primary me-2"></i>Verify Application</h5>
          <button type="button" class="btn-close" aria-label="Close" onclick={() => showCodeModal = false}></button>
        </div>
        <div class="modal-body py-4">
          <div class="alert alert-info border-0 rounded-3 mb-3">
            <p class="small mb-1 fw-bold"><i class="bi bi-google me-1"></i>Mock Gmail Inbox Alert:</p>
            <p class="small mb-0">We sent a verification code to <strong>{currentUserObj?.email || 'student@sonainfo.edu'}</strong>.</p>
            <div class="mt-2 p-2 bg-white rounded text-center font-mono fs-4 fw-bold text-primary">
              {receivedCode}
            </div>
          </div>

          {#if verifySuccessMsg}
            <div class="alert alert-success">{verifySuccessMsg}</div>
          {/if}

          {#if verifyErrorMsg}
            <div class="alert alert-danger">{verifyErrorMsg}</div>
          {/if}

          <div class="mb-3">
            <label for="codeInp" class="form-label small fw-bold">Enter 6-Digit Code</label>
            <input type="text" id="codeInp" class="form-control form-control-lg text-center font-mono" placeholder="123456" bind:value={inputCode} maxlength="6">
          </div>

          <button class="btn btn-primary-custom w-100 py-2.5 text-dark fw-bold" onclick={handleVerify} disabled={verifying}>
            {verifying ? 'Verifying...' : 'Verify & Submit Profile'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<Footer />
