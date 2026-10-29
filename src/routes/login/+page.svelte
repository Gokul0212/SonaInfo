<script>
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { loginUser } from '$lib/firebaseService.js';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let email = $state('');
  let password = $state('');
  let role = $state('student');
  let errorMsg = $state('');
  let loading = $state(false);
  let showPassword = $state(false);

  onMount(() => {
    // If user is already logged in, redirect them to their dashboard
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && u.role) {
          if (u.role === 'admin') {
            goto('/admin/dashboard');
          } else {
            goto('/dashboard');
          }
          return; // stop further processing
        }
      }
    } catch (e) {}

    // Read URL param using native URLSearchParams for reliability
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam === 'admin') {
      role = 'admin';
    }
  });

  function setRoleContext(newRole) {
    role = newRole;
    errorMsg = '';
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) {
      errorMsg = 'Please fill out all fields.';
      return;
    }

    loading = true;
    errorMsg = '';

    try {
      const res = await loginUser(email, password, role === 'admin' ? 'admin' : 'user');
      if (res.success) {
        if (res.user.role === 'admin') {
          goto('/admin/dashboard');
        } else {
          goto('/dashboard');
        }
      }
    } catch (err) {
      errorMsg = err.message || 'Login failed. Please check credentials.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Login - SonaInfo</title>
</svelte:head>

<Navbar />

<!-- Login Main Content -->
<main class="container my-5 py-3">
  <div class="row justify-content-center">
    <div class="col-md-11 col-lg-10 col-xl-9">
      <div class="card login-card">
        <div class="row g-0">
          <!-- Left Column: Side Face Illustration / Brand Graphic with Animations -->
          <div class="col-md-5 d-none d-md-flex flex-column align-items-center justify-content-center p-5 text-white login-illustration-pane text-center">
            <div class="position-absolute top-0 start-0 w-100 h-100 bg-cover" style="background-image: url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60'); opacity: 0.12; filter: grayscale(100%); background-size: cover; background-position: center;"></div>
            
            <div class="position-relative z-1 w-100">
              <!-- Silhouette/Side profile face box representation with floating micro-animation -->
              <div class="face-avatar-container">
                <i class="bi bi-person-bounding-box"></i>
              </div>
              
              <h3 class="fw-bold text-white mb-2 font-heading">Welcome Back</h3>
              <p class="text-white-50 small mb-4 px-2">Access your portal to view verified notices, update academic records, or share campus stories.</p>
              
              <!-- Modern Feature Badges with Micro-interactions -->
              <div class="d-flex flex-column gap-2 text-start px-2">
                <div class="login-feature-chip">
                  <i class="bi bi-patch-check-fill text-warning"></i>
                  <span>College Verified Portal</span>
                </div>
                <div class="login-feature-chip">
                  <i class="bi bi-lightning-charge-fill text-info"></i>
                  <span>Instant Announcement Alerts</span>
                </div>
                <div class="login-feature-chip">
                  <i class="bi bi-people-fill text-success"></i>
                  <span>Student Community Feed</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Right Column: Login Form -->
          <div class="col-md-7 p-4 p-lg-5">
            <div class="text-center text-md-start mb-4">
              <div class="d-flex align-items-center justify-content-center justify-content-md-start gap-3 mb-3">
                <img src="/uploads/logo.png" alt="SonaInfo Logo" class="brand-logo-large">
                <div>
                  <span class="fs-3 fw-extrabold text-dark font-heading d-block" style="letter-spacing: -0.5px;">Sona<span class="text-warning">Info</span></span>
                  <span class="text-muted small fw-semibold text-uppercase" style="font-size: 0.7rem; letter-spacing: 1px;">Student & Faculty Hub</span>
                </div>
              </div>
              <h3 class="fw-bold mb-1 text-dark font-heading">{role === 'admin' ? 'Admin Login' : 'Student Login'}</h3>
              <p class="text-muted small mb-0">{role === 'admin' ? 'Administrator dashboard sign-in' : 'Sign in to share news, browse updates, and view your submissions'}</p>
            </div>

            {#if errorMsg}
              <div class="alert alert-danger animate-fade-in-up" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>{errorMsg}
              </div>
            {/if}

            <form onsubmit={handleLogin}>
              <!-- Email -->
              <div class="mb-3">
                <label for="email" class="form-label fw-bold small text-secondary">College Email Address</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0 rounded-start-3"><i class="bi bi-envelope text-muted"></i></span>
                  <input type="email" class="form-control form-control-modern border-start-0 rounded-end-3" id="email" bind:value={email} placeholder="name@sonainfo.edu" required>
                </div>
              </div>

              <!-- Password -->
              <div class="mb-3">
                <label for="password" class="form-label fw-bold small text-secondary">Password</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0 rounded-start-3"><i class="bi bi-lock text-muted"></i></span>
                  <input type={showPassword ? 'text' : 'password'} class="form-control form-control-modern border-start-0 border-end-0" id="password" bind:value={password} placeholder="••••••••" required>
                  <button class="btn btn-light border border-start-0 text-muted rounded-end-3" type="button" aria-label="Toggle password visibility" onclick={() => showPassword = !showPassword}>
                    <i class={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                  </button>
                </div>
              </div>

              <!-- Submit Button with Glitter Glow & Shimmer Sparkles -->
              <button type="submit" class="btn btn-glitter-glow w-100 mt-3 d-flex align-items-center justify-content-center gap-2" disabled={loading}>
                <i class="bi bi-stars fs-5"></i>
                <span>{loading ? 'Authenticating with Firebase...' : 'Sign In to Portal'}</span>
                {#if loading}
                  <div class="spinner-border spinner-border-sm" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                {/if}
              </button>
            </form>


            <!-- Role Context Switcher -->
            <div class="mt-4 pt-3 border-top text-center">
              {#if role === 'student'}
                <p class="small text-muted mb-1">Are you an administrator? 
                  <a href="#admin" onclick={(e) => { e.preventDefault(); setRoleContext('admin'); }} class="fw-bold text-decoration-none text-warning">Switch to Admin Portal</a>
                </p>
              {:else}
                <p class="small text-muted mb-1">Are you a student? 
                  <a href="#student" onclick={(e) => { e.preventDefault(); setRoleContext('student'); }} class="fw-bold text-decoration-none text-primary">Switch to Student Portal</a>
                </p>
              {/if}
              <p class="small text-muted mb-0">Don't have an account yet? 
                <a href="/register" class="fw-bold text-decoration-none text-primary">Register Here</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>

<Footer />
