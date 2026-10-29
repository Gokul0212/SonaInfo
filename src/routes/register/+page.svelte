<script>
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { registerUser } from '$lib/firebaseService.js';
  import { goto } from '$app/navigation';

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let department = $state('');
  let year = $state('');
  let role = $state('user'); // 'user' or 'admin'
  let createdAdminCode = $state('');
  let errorMsg = $state('');
  let successMsg = $state('');
  let loading = $state(false);

  async function handleRegister(e) {
    e.preventDefault();
    if (!name || !email || !password) {
      errorMsg = 'Please fill out all required fields.';
      return;
    }

    loading = true;
    errorMsg = '';
    successMsg = '';
    createdAdminCode = '';

    try {
      const res = await registerUser({ name, email, password, department, year, role });
      if (res.success) {
        if (role === 'admin' && res.adminCode) {
          createdAdminCode = res.adminCode;
          successMsg = `Admin account created! Your Unique Admin Code is: ${res.adminCode}. Redirecting to Admin Login...`;
          setTimeout(() => {
            goto('/login?role=admin');
          }, 2500);
        } else {
          successMsg = 'Account created successfully! Redirecting to login...';
          setTimeout(() => {
            goto('/login');
          }, 1500);
        }
      }
    } catch (err) {
      errorMsg = err.message || 'Registration failed. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Register Account - SonaInfo</title>
</svelte:head>

<Navbar />

<main class="container my-5">
  <div class="row justify-content-center">
    <div class="col-md-8 col-lg-6">
      <div class="card border-0 shadow-lg p-4 rounded-4 bg-white">
        <div class="text-center mb-4">
          <img src="/uploads/logo.png" alt="SonaInfo Logo" height="70" class="mb-3 rounded bg-light p-1 shadow-sm">
          <h3 class="fw-bold mb-1 text-dark">Create Account</h3>
          <p class="text-muted small">Register as a student or administrator to access the campus portal</p>

          <!-- Account Type Switcher -->
          <div class="d-flex justify-content-center gap-2 mt-3 p-1 bg-light rounded-pill border">
            <button
              type="button"
              class="btn btn-sm rounded-pill px-4 fw-bold transition-all {role === 'user' ? 'btn-primary text-white shadow-sm' : 'text-muted border-0'}"
              onclick={() => { role = 'user'; }}
            >
              <i class="bi bi-person me-1"></i> Student
            </button>
            <button
              type="button"
              class="btn btn-sm rounded-pill px-4 fw-bold transition-all {role === 'admin' ? 'btn-warning text-dark shadow-sm' : 'text-muted border-0'}"
              onclick={() => { role = 'admin'; }}
            >
              <i class="bi bi-shield-lock-fill me-1"></i> Administrator
            </button>
          </div>
        </div>

        {#if createdAdminCode}
          <div class="alert alert-warning border border-warning-subtle rounded-3 p-3 mb-3 text-center">
            <div class="small text-uppercase fw-bold text-dark">Your Unique Admin Code</div>
            <div class="fs-3 fw-bolder font-monospace text-dark my-1">{createdAdminCode}</div>
            <small class="text-muted d-block">Save this code. You will need it for admin identification.</small>
          </div>
        {/if}

        {#if errorMsg}
          <div class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>{errorMsg}
          </div>
        {/if}

        {#if successMsg}
          <div class="alert alert-success" role="alert">
            <i class="bi bi-check-circle-fill me-2"></i>{successMsg}
          </div>
        {/if}

        <form onsubmit={handleRegister}>
          <div class="row">
            <!-- Full Name -->
            <div class="col-12 mb-3">
              <label for="name" class="form-label fw-bold">Full Name <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text bg-light"><i class="bi bi-person text-muted"></i></span>
                <input type="text" class="form-control bg-light" id="name" bind:value={name} placeholder="John Doe" required>
              </div>
            </div>

            <!-- Email -->
            <div class="col-12 mb-3">
              <label for="email" class="form-label fw-bold">College Email <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text bg-light"><i class="bi bi-envelope text-muted"></i></span>
                <input type="email" class="form-control bg-light" id="email" bind:value={email} placeholder="john@sonainfo.edu" required>
              </div>
              <div class="form-text small">Please use your valid university email address.</div>
            </div>

            {#if role === 'user'}
              <!-- Department -->
              <div class="col-md-6 mb-3">
                <label for="department" class="form-label fw-bold">Department</label>
                <select class="form-select bg-light" id="department" bind:value={department}>
                  <option value="">Select Department</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Business Administration">Business Administration</option>
                  <option value="Science & Humanities">Science & Humanities</option>
                </select>
              </div>

              <!-- Year -->
              <div class="col-md-6 mb-3">
                <label for="year" class="form-label fw-bold">Academic Year</label>
                <select class="form-select bg-light" id="year" bind:value={year}>
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="Faculty">Faculty</option>
                </select>
              </div>
            {:else}
              <!-- Admin Department & Unique Code Info -->
              <div class="col-12 mb-3">
                <div class="p-3 bg-warning-subtle border border-warning rounded-3">
                  <div class="fw-bold small text-dark d-flex align-items-center gap-2">
                    <i class="bi bi-shield-check text-warning fs-5"></i>
                    <span>Administrator Profile</span>
                  </div>
                  <p class="small text-muted mb-0 mt-1">
                    Registering as an Administrator automatically assigns Administration access and generates a permanent <strong>Unique Admin Code</strong> (e.g., ADM-XXXX) to identify your admin profile across the dashboard.
                  </p>
                </div>
              </div>
            {/if}

            <!-- Password -->
            <div class="col-12 mb-4">
              <label for="password" class="form-label fw-bold">Password <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text bg-light"><i class="bi bi-lock text-muted"></i></span>
                <input type="password" class="form-control bg-light" id="password" bind:value={password} placeholder="Create secure password (min 6 characters)" required minlength="6">
              </div>
            </div>
          </div>

          <button type="submit" class="btn btn-primary-custom w-100 py-2.5 fw-bold text-dark rounded-3 d-flex align-items-center justify-content-center gap-2" disabled={loading}>
            <span>{loading ? 'Creating Firebase Account...' : 'Create Account'}</span>
            {#if loading}
              <div class="spinner-border spinner-border-sm" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            {/if}
          </button>
        </form>

        <div class="text-center mt-4">
          <p class="small text-muted mb-0">Already have an account? <a href="/login" class="text-primary fw-bold text-decoration-none">Sign In</a></p>
        </div>
      </div>
    </div>
  </div>
</main>

<Footer />
