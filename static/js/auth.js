// SonaInfo Authentication Controller

document.addEventListener('DOMContentLoaded', () => {
  // Toggle password visibility
  const togglePasswordBtn = document.getElementById('togglePassword');
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const passwordInput = document.getElementById('password');
      const toggleIcon = document.getElementById('toggleIcon');
      if (passwordInput && toggleIcon) {
        const isPassword = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
        toggleIcon.className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
      }
    });
  }

  // Dual Login Context Switch (Student / Admin)
  const adminToggle = document.getElementById('adminLoginToggle');
  const studentToggle = document.getElementById('studentLoginToggle');
  const loginHeader = document.getElementById('loginHeader');
  const loginSubtitle = document.getElementById('loginSubtitle');
  const loginRoleInput = document.getElementById('loginRole');
  const errorAlert = document.getElementById('errorAlert');

  if (adminToggle && studentToggle) {
    adminToggle.addEventListener('click', (e) => {
      e.preventDefault();
      loginHeader.innerText = 'Admin Login';
      loginSubtitle.innerText = 'Administrator dashboard sign-in';
      loginRoleInput.value = 'admin';
      adminToggle.classList.add('d-none');
      studentToggle.classList.remove('d-none');
      if (errorAlert) errorAlert.classList.add('d-none');
    });

    studentToggle.addEventListener('click', (e) => {
      e.preventDefault();
      loginHeader.innerText = 'Student Login';
      loginSubtitle.innerText = 'Sign in to share and manage campus updates';
      loginRoleInput.value = 'student';
      studentToggle.classList.add('d-none');
      adminToggle.classList.remove('d-none');
      if (errorAlert) errorAlert.classList.add('d-none');
    });
  }

  // Check URL query parameters for role context preset
  const urlParams = new URLSearchParams(window.location.search);
  const roleParam = urlParams.get('role');
  if (roleParam === 'admin' && adminToggle && studentToggle) {
    loginHeader.innerText = 'Admin Login';
    loginSubtitle.innerText = 'Administrator dashboard sign-in';
    loginRoleInput.value = 'admin';
    adminToggle.classList.add('d-none');
    studentToggle.classList.remove('d-none');
  }

  // Global Auto-fill Helper
  window.fillCreds = (email, password) => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    if (emailInput && passwordInput) {
      emailInput.value = email;
      passwordInput.value = password;
      
      if (email === 'admin@sonainfo.edu') {
        if (loginHeader) loginHeader.innerText = 'Admin Login';
        if (loginSubtitle) loginSubtitle.innerText = 'Administrator dashboard sign-in';
        if (loginRoleInput) loginRoleInput.value = 'admin';
        if (adminToggle) adminToggle.classList.add('d-none');
        if (studentToggle) studentToggle.classList.remove('d-none');
      } else {
        if (loginHeader) loginHeader.innerText = 'Student Login';
        if (loginSubtitle) loginSubtitle.innerText = 'Sign in to share and manage campus updates';
        if (loginRoleInput) loginRoleInput.value = 'student';
        if (studentToggle) studentToggle.classList.add('d-none');
        if (adminToggle) adminToggle.classList.remove('d-none');
      }
      if (errorAlert) errorAlert.classList.add('d-none');
    }
  };

  // Handle Login Form Submission
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const role = loginRoleInput.value;
      const submitBtn = document.getElementById('loginSubmitBtn');
      const spinner = document.getElementById('loginSpinner');
      
      if (errorAlert) errorAlert.classList.add('d-none');

      // Simple validation
      if (!email || !password) {
        showFormError('Please fill out all fields.');
        return;
      }

      // Show spinner
      submitBtn.disabled = true;
      if (spinner) spinner.classList.remove('d-none');

      try {
        const endpoint = role === 'admin' ? '/api/auth/admin-login' : '/api/auth/login';
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Save credentials in local storage
          localStorage.setItem('token', result.token);
          localStorage.setItem('user', JSON.stringify(result.user));
          
          // Redirect based on role
          setTimeout(() => {
            if (result.user.role === 'admin') {
              window.location.href = '/admin-dashboard.html';
            } else {
              window.location.href = '/dashboard.html';
            }
          }, 500);
        } else {
          showFormError(result.message || 'Authentication failed. Please verify credentials.');
          submitBtn.disabled = false;
          if (spinner) spinner.classList.add('d-none');
        }
      } catch (err) {
        console.error('Login error:', err);
        showFormError('Network or server error occurred. Try again.');
        submitBtn.disabled = false;
        if (spinner) spinner.classList.add('d-none');
      }
    });
  }

  // Handle Register Form Submission
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const department = document.getElementById('department').value;
      const year = document.getElementById('year').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const submitBtn = document.getElementById('registerSubmitBtn');
      const spinner = document.getElementById('registerSpinner');

      if (errorAlert) errorAlert.classList.add('d-none');

      // Validation
      if (!name || !email || !password || !confirmPassword) {
        showFormError('Please fill out all required fields.');
        return;
      }

      if (password.length < 6) {
        showFormError('Password must be at least 6 characters long.');
        return;
      }

      if (password !== confirmPassword) {
        showFormError('Passwords do not match.');
        return;
      }

      // Show loading
      submitBtn.disabled = true;
      if (spinner) spinner.classList.remove('d-none');

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, department, year })
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Success Redirect to login
          alert('Registration successful! Redirecting to login page...');
          window.location.href = '/login.html';
        } else {
          showFormError(result.message || 'Registration failed.');
          submitBtn.disabled = false;
          if (spinner) spinner.classList.add('d-none');
        }
      } catch (err) {
        console.error('Registration error:', err);
        showFormError('Network or server error occurred. Try again.');
        submitBtn.disabled = false;
        if (spinner) spinner.classList.add('d-none');
      }
    });
  }

  // Form error helper
  function showFormError(msg) {
    if (errorAlert) {
      errorAlert.innerText = msg;
      errorAlert.classList.remove('d-none');
    } else {
      alert(msg);
    }
  }
});
