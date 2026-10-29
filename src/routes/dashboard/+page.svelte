<script>
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { getNewsList, getMySubmissions, updateUserProfile, submitUserMessage, getUserMessages } from '$lib/firebaseService.js';
  import { formatDate, theme } from '$lib/stores.js';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { userProfile } from '$lib/firebaseService.js';

  let user = $state(null);
  let greeting = $state('Welcome');
  let stats = $state({ publishedNews: 0, mySubmissions: 0, pending: 0, approved: 0 });
  let latestNews = $state([]);
  let loading = $state(true);

  // Profile edit
  let editMode = $state(false);
  let editName = $state('');
  let editDepartment = $state('');
  let editYear = $state('');
  let profileSaving = $state(false);
  let profileSuccess = $state('');
  let profileError = $state('');

  // Chatbox / Contact Admin state
  let userMessages = $state([]);
  let messagesLoading = $state(false);
  let msgType = $state('General Message');
  let msgSubject = $state('');
  let msgContent = $state('');
  let msgSubmitting = $state(false);
  let msgSuccess = $state('');
  let msgError = $state('');
  let chatboxPopupOpen = $state(false);
  let chatTab = $state('new'); // 'new' | 'history'
  let viewingMessageDetails = $state(null);

  function toggleChatboxPopup() {
    chatboxPopupOpen = !chatboxPopupOpen;
    if (chatboxPopupOpen) {
      loadUserMessages();
    }
  }


  onMount(async () => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) { goto('/login'); return; }
      user = JSON.parse(stored);
      if (user.role === 'admin') { goto('/admin/dashboard'); return; }

      const hr = new Date().getHours();
      if (hr < 12) greeting = 'Good Morning';
      else if (hr < 17) greeting = 'Good Afternoon';
      else greeting = 'Good Evening';

      const [allRes, myRes, msgsRes] = await Promise.all([
        getNewsList({ limit: 50 }),
        getMySubmissions(user.id || user.userId),
        getUserMessages(user.id || user.userId)
      ]);

      const all = allRes.data || [];
      const mine = myRes.data || [];
      userMessages = msgsRes.data || [];

      stats.publishedNews = all.filter(n => n.status === 'approved').length;
      stats.mySubmissions = mine.length;
      stats.pending = mine.filter(n => n.status === 'pending').length;
      stats.approved = mine.filter(n => n.status === 'approved').length;

      latestNews = all.filter(n => n.status === 'approved').slice(0, 4);
    } catch (e) { console.error(e); }
    finally { loading = false; }
  });

  async function loadUserMessages() {
    if (!user) return;
    messagesLoading = true;
    try {
      const res = await getUserMessages(user.id || user.userId);
      if (res.success) {
        userMessages = res.data;
      }
    } catch (e) {
      console.error(e);
    } finally {
      messagesLoading = false;
    }
  }

  async function handleSendMessage(e) {
    e?.preventDefault();
    msgError = '';
    msgSuccess = '';

    if (!msgSubject.trim()) {
      msgError = 'Please enter a message subject.';
      return;
    }
    if (!msgContent.trim()) {
      msgError = 'Please enter your message content.';
      return;
    }

    msgSubmitting = true;
    try {
      const res = await submitUserMessage({
        messageType: msgType,
        subject: msgSubject.trim(),
        message: msgContent.trim()
      }, user);

      if (res.success) {
        msgSuccess = 'Your message has been submitted successfully! Admin will verify it shortly.';
        msgSubject = '';
        msgContent = '';
        msgType = 'General Message';
        await loadUserMessages();
        setTimeout(() => { msgSuccess = ''; }, 5000);
      }
    } catch (err) {
      msgError = err.message || 'Failed to submit message. Please try again.';
    } finally {
      msgSubmitting = false;
    }
  }

  function startEdit() {
    editName = user?.name || '';
    editDepartment = user?.department || '';
    editYear = user?.year || '';
    profileError = ''; profileSuccess = '';
    editMode = true;
  }

  async function saveProfile() {
    if (!editName.trim()) { profileError = 'Name cannot be empty.'; return; }
    profileSaving = true; profileError = '';
    try {
      const res = await updateUserProfile(user.id || user.userId, {
        name: editName.trim(),
        department: editDepartment,
        year: editYear
      });
      if (res.success) {
        user = { ...user, name: editName.trim(), department: editDepartment, year: editYear };
        userProfile.set(user);
        profileSuccess = 'Profile updated successfully!';
        editMode = false;
        setTimeout(() => profileSuccess = '', 3000);
      }
    } catch (e) {
      profileError = e.message || 'Failed to update profile.';
    } finally { profileSaving = false; }
  }
</script>

<svelte:head>
  <title>Student Dashboard - SonaInfo</title>
</svelte:head>

<Navbar />

<main class="container my-4">
  {#if profileSuccess}
    <div class="alert alert-success alert-dismissible fade show mb-4 rounded-4" role="alert">
      <i class="bi bi-check-circle-fill me-2"></i>{profileSuccess}
      <button type="button" class="btn-close" aria-label="Close" onclick={() => profileSuccess = ''}></button>
    </div>
  {/if}

  <!-- Top Welcome Banner -->
  <div class="card dashboard-banner p-4 p-md-5 mb-4 position-relative overflow-hidden">
    <div class="position-absolute end-0 bottom-0 opacity-10 d-none d-md-block" style="font-size: 10rem; transform: translate(30px, 40px);">
      <i class="bi bi-mortarboard-fill"></i>
    </div>
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center position-relative gap-3" style="z-index: 2;">
      <div>
        <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
          <span class="badge bg-success bg-opacity-25 text-success border border-success-subtle px-3 py-1 rounded-pill small fw-bold d-inline-flex align-items-center gap-2">
            <span class="p-1 bg-success rounded-circle" style="width:8px;height:8px;display:inline-block;"></span> Live Student Portal
          </span>
          <span class="badge bg-white bg-opacity-10 text-white-50 px-2 py-1 rounded-pill small">Academic Hub 2026</span>
        </div>
        <h2 class="fw-bold mb-1 font-heading text-white">{greeting}, {user?.name || 'Student'} 👋</h2>
        <p class="mb-0 text-white-50 small">Here is your campus news overview, personal submission metrics, and live notices.</p>
      </div>
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <a href="/share-news" class="btn btn-glitter-glow btn-sm shadow-sm">
          <i class="bi bi-stars"></i><span>Share News</span>
        </a>
        <a href="/my-news" class="btn btn-outline-light btn-sm rounded-pill px-3">
          <i class="bi bi-journal-text me-1"></i> My News
        </a>
        <a href="/news" class="btn btn-outline-light btn-sm rounded-pill px-3">
          <i class="bi bi-newspaper me-1"></i> Browse News
        </a>
      </div>
    </div>
  </div>

  <!-- Statistics Overview Cards -->
  <div class="row g-4 mb-4">
    <div class="col-md-3 col-sm-6">
      <div class="stat-card-modern h-100 d-flex flex-row align-items-center gap-3">
        <div class="stat-icon-wrapper bg-primary bg-opacity-10 text-primary"><i class="bi bi-newspaper"></i></div>
        <div>
          <h3 class="stat-number mb-0">{stats.publishedNews}</h3>
          <span class="text-muted small fw-semibold">Published News</span>
          <div class="small text-primary mt-1 fw-semibold" style="font-size: 0.72rem;"><i class="bi bi-broadcast me-1"></i>Live Campus Feed</div>
        </div>
      </div>
    </div>
    <div class="col-md-3 col-sm-6">
      <div class="stat-card-modern h-100 d-flex flex-row align-items-center gap-3">
        <div class="stat-icon-wrapper bg-info bg-opacity-10 text-info"><i class="bi bi-collection"></i></div>
        <div>
          <h3 class="stat-number mb-0">{stats.mySubmissions}</h3>
          <span class="text-muted small fw-semibold">My Submissions</span>
          <div class="small text-info mt-1 fw-semibold" style="font-size: 0.72rem;"><i class="bi bi-journal-check me-1"></i>Your Contributions</div>
        </div>
      </div>
    </div>
    <div class="col-md-3 col-sm-6">
      <div class="stat-card-modern h-100 d-flex flex-row align-items-center gap-3">
        <div class="stat-icon-wrapper bg-warning bg-opacity-10 text-warning"><i class="bi bi-hourglass-split"></i></div>
        <div>
          <h3 class="stat-number mb-0">{stats.pending}</h3>
          <span class="text-muted small fw-semibold">Pending Review</span>
          <div class="small text-warning mt-1 fw-semibold" style="font-size: 0.72rem;"><i class="bi bi-clock-history me-1"></i>Under Moderation</div>
        </div>
      </div>
    </div>
    <div class="col-md-3 col-sm-6">
      <div class="stat-card-modern h-100 d-flex flex-row align-items-center gap-3">
        <div class="stat-icon-wrapper bg-success bg-opacity-10 text-success"><i class="bi bi-patch-check"></i></div>
        <div>
          <h3 class="stat-number mb-0">{stats.approved}</h3>
          <span class="text-muted small fw-semibold">Approved Articles</span>
          <div class="small text-success mt-1 fw-semibold" style="font-size: 0.72rem;"><i class="bi bi-check-circle-fill me-1"></i>Publicly Shared</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Profile & Campus Feed Grid -->
  <div class="row g-4">
    <!-- Left Column: Student Profile -->
    <div class="col-lg-4">
      <div class="card border-0 shadow-sm p-4 rounded-4 bg-white h-100">
        {#if !editMode}
          <div class="text-center mb-4">
            <div class="position-relative d-inline-block">
              <div class="rounded-circle shadow-sm border border-3 border-light bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style="width: 100px; height: 100px; font-size: 2.5rem; font-weight: 700; margin: 0 auto;">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <span class="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle" style="width: 18px; height: 18px;"></span>
            </div>
            <h5 class="fw-bold text-dark mt-3 mb-1 font-heading">{user?.name || 'Student'}</h5>
            <span class="badge bg-primary-subtle text-primary fw-semibold px-3 py-1 rounded-pill">{user?.department || 'Information Technology'}</span>
          </div>

          <ul class="list-group list-group-flush small mb-4">
            <li class="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
              <span class="text-muted"><i class="bi bi-envelope me-2"></i>Email</span>
              <span class="fw-semibold text-dark text-end" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{user?.email || 'student@sonainfo.edu'}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
              <span class="text-muted"><i class="bi bi-calendar3 me-2"></i>Academic Year</span>
              <span class="fw-semibold text-dark">{user?.year || 'N/A'}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
              <span class="text-muted"><i class="bi bi-shield-check me-2"></i>Role</span>
              <span class="badge bg-secondary text-uppercase">{user?.role || 'STUDENT'}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
              <span class="text-muted"><i class="bi bi-activity me-2"></i>Status</span>
              <span class="badge bg-success">{user?.status?.toUpperCase() || 'ACTIVE'}</span>
            </li>
          </ul>

          <div class="d-flex flex-column gap-2">
            <button class="btn btn-outline-primary w-100 rounded-3 fw-bold" onclick={startEdit}>
              <i class="bi bi-pencil me-1"></i> Edit Profile
            </button>
            <a href="/share-news" class="btn btn-primary-custom w-100 py-2 fw-bold text-dark rounded-3 d-flex align-items-center justify-content-center gap-2">
              <i class="bi bi-plus-circle"></i> Create New Submission
            </a>
          </div>
        {:else}
          <!-- Edit Profile Form -->
          <div class="mb-3 d-flex align-items-center gap-2">
            <i class="bi bi-pencil-square text-primary fs-5"></i>
            <h5 class="fw-bold text-dark mb-0">Edit Profile</h5>
          </div>

          {#if profileError}
            <div class="alert alert-danger rounded-3 small"><i class="bi bi-exclamation-triangle me-1"></i>{profileError}</div>
          {/if}

          <div class="mb-3">
            <label for="editName" class="form-label fw-bold small">Full Name <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="editName" bind:value={editName} required>
          </div>
          <div class="mb-3">
            <label for="editDepartment" class="form-label fw-bold small">Department</label>
            <select class="form-select" id="editDepartment" bind:value={editDepartment}>
              <option value="">Select Department</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Business Administration">Business Administration</option>
              <option value="Science & Humanities">Science & Humanities</option>
            </select>
          </div>
          <div class="mb-4">
            <label for="editYear" class="form-label fw-bold small">Academic Year</label>
            <select class="form-select" id="editYear" bind:value={editYear}>
              <option value="">Select Year</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              <option value="Postgraduate">Postgraduate</option>
              <option value="Faculty">Faculty</option>
            </select>
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-primary flex-grow-1 rounded-3 fw-bold" onclick={saveProfile} disabled={profileSaving}>
              {#if profileSaving}<span class="spinner-border spinner-border-sm me-2"></span>{/if}
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button class="btn btn-light rounded-3" onclick={() => editMode = false}>Cancel</button>
          </div>
        {/if}
      </div>
    </div>

    <!-- Right Column: Recent Campus Announcements -->
    <div class="col-lg-8">
      <div class="card border-0 shadow-sm p-4 rounded-4 bg-white h-100">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h5 class="fw-bold text-dark mb-0 font-heading"><i class="bi bi-newspaper text-primary me-2"></i>Latest Campus Announcements</h5>
          <a href="/news" class="btn btn-link text-decoration-none small fw-semibold">View All <i class="bi bi-chevron-right"></i></a>
        </div>

        {#if loading}
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
          </div>
        {:else if latestNews.length === 0}
          <div class="text-center py-5">
            <i class="bi bi-newspaper text-muted display-4"></i>
            <h6 class="mt-3 fw-bold text-dark">No Announcements Yet</h6>
            <p class="text-muted small">Check back soon for campus news and updates!</p>
          </div>
        {:else}
          <div class="row g-3">
            {#each latestNews as item}
              <div class="col-md-6">
                <div class="news-card h-100">
                  <div class="news-img-wrapper" style="height: 140px;">
                    <span class="category-badge">{item.category}</span>
                    <img src={item.imageUrl || '/uploads/logo.png'} class="news-img" alt={item.title}
                      onerror={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&auto=format&fit=crop&q=60'; }}>
                  </div>
                  <div class="news-body p-3">
                    <h6 class="news-title fs-6 fw-bold" title={item.title}>{item.title}</h6>
                    <div class="news-footer pt-2 mt-auto">
                      <span class="news-date small text-muted"><i class="bi bi-calendar3 me-1"></i>{formatDate(item.createdAt)}</span>
                      <a href="/news/{item.id || item._id}" class="btn-read-more small">Read <i class="bi bi-arrow-right"></i></a>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>



  <!-- Quick Actions -->
  <div class="row g-4 mt-1">
    <div class="col-12">
      <div class="card border-0 shadow-sm p-4 rounded-4 bg-white">
        <h5 class="fw-bold text-dark mb-3 font-heading"><i class="bi bi-grid-fill text-info me-2"></i>Quick Actions</h5>
        <div class="row g-3">
          {#each [
            { href: '/news', icon: 'bi-newspaper', label: 'Browse All News', color: 'primary' },
            { href: '/share-news', icon: 'bi-megaphone', label: 'Share Campus News', color: 'success' },
            { href: '/my-news', icon: 'bi-journal-text', label: 'My Submissions', color: 'info' },
            { href: '/news?category=Events', icon: 'bi-calendar-event', label: 'Upcoming Events', color: 'warning' },
            { href: '/news?category=Placements', icon: 'bi-briefcase', label: 'Placement News', color: 'danger' },
            { href: '/news?category=Achievements', icon: 'bi-trophy', label: 'Achievements', color: 'secondary' }
          ] as action}
            <div class="col-md-2 col-sm-4 col-6">
              <a href={action.href} class="card p-3 text-decoration-none border-0 rounded-3 bg-{action.color} bg-opacity-10 text-center h-100 hover-shadow">
                <i class="bi {action.icon} fs-3 text-{action.color} mb-1 d-block"></i>
                <span class="fw-bold text-dark small">{action.label}</span>
              </a>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- Floating Oval Shape Contact Admin Chatbox Button (Fixed Bottom Right) -->
  <aside class="floating-chatbox-container" aria-label="Contact Admin Chatbox">
    <!-- Chatbox Popup Card -->
    {#if chatboxPopupOpen}
      <div class="chatbox-card shadow-lg rounded-4 overflow-hidden mb-3 animate-slide-up bg-white border">
        <!-- Chatbox Header with Tabs -->
        <div class="chatbox-header bg-warning text-dark p-3 pb-2">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <div class="d-flex align-items-center gap-2">
              <div class="rounded-circle bg-dark text-warning p-1 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; font-size: 1rem;">
                <i class="bi bi-chat-dots-fill"></i>
              </div>
              <div>
                <h6 class="mb-0 fw-bold">Contact Admin</h6>
                <span class="text-dark-50 small" style="font-size: 0.72rem;">Online • SonaInfo Support</span>
              </div>
            </div>
            <button type="button" class="btn-close btn-close-dark" aria-label="Close Chatbox" onclick={toggleChatboxPopup}></button>
          </div>

          <!-- Tabs: Send Message / My Messages -->
          <ul class="nav nav-pills nav-fill bg-white bg-opacity-25 rounded-pill p-1 small">
            <li class="nav-item">
              <button
                type="button"
                class="nav-link py-1 px-2 rounded-pill small fw-bold {chatTab === 'new' ? 'active bg-dark text-warning' : 'text-dark'}"
                onclick={() => { chatTab = 'new'; viewingMessageDetails = null; }}
              >
                <i class="bi bi-pencil-square me-1"></i> New
              </button>
            </li>
            <li class="nav-item">
              <button
                type="button"
                class="nav-link py-1 px-2 rounded-pill small fw-bold {chatTab === 'history' ? 'active bg-dark text-warning' : 'text-dark'}"
                onclick={() => { chatTab = 'history'; loadUserMessages(); }}
              >
                <i class="bi bi-clock-history me-1"></i> Messages ({userMessages.length})
              </button>
            </li>
          </ul>
        </div>

        <!-- Chatbox Body -->
        <div class="chatbox-body p-3" style="max-height: 420px; overflow-y: auto;">
          {#if chatTab === 'new'}
            {#if msgSuccess}
              <div class="alert alert-success alert-dismissible fade show rounded-3 small p-2 mb-2" role="alert">
                <i class="bi bi-check-circle-fill me-1"></i>{msgSuccess}
                <button type="button" class="btn-close btn-close-sm" aria-label="Close alert" onclick={() => msgSuccess = ''}></button>
              </div>
            {/if}

            {#if msgError}
              <div class="alert alert-danger alert-dismissible fade show rounded-3 small p-2 mb-2" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-1"></i>{msgError}
                <button type="button" class="btn-close btn-close-sm" aria-label="Close alert" onclick={() => msgError = ''}></button>
              </div>
            {/if}

            <form onsubmit={handleSendMessage}>
              <div class="mb-2">
                <label for="floatingMsgType" class="form-label fw-bold small text-dark mb-1">Message Type</label>
                <select id="floatingMsgType" class="form-select form-select-sm rounded-3" bind:value={msgType}>
                  <option value="General Message">General Message</option>
                  <option value="Complaint">Complaint</option>
                </select>
              </div>

              <div class="mb-2">
                <label for="floatingSubject" class="form-label fw-bold small text-dark mb-1">Subject</label>
                <input
                  type="text"
                  id="floatingSubject"
                  class="form-control form-control-sm rounded-3"
                  placeholder="Topic or issue..."
                  bind:value={msgSubject}
                  maxlength="150"
                  required
                />
              </div>

              <div class="mb-3">
                <label for="floatingMessage" class="form-label fw-bold small text-dark mb-1">Message</label>
                <textarea
                  id="floatingMessage"
                  class="form-control form-control-sm rounded-3"
                  rows="3"
                  placeholder="Write your message or complaint..."
                  bind:value={msgContent}
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                class="btn btn-warning w-100 btn-sm py-2 fw-bold text-dark rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2"
                disabled={msgSubmitting}
              >
                {#if msgSubmitting}
                  <span class="spinner-border spinner-border-sm" role="status"></span>
                  <span>Sending...</span>
                {:else}
                  <i class="bi bi-send-fill"></i>
                  <span>Send Message</span>
                {/if}
              </button>
            </form>
          {:else}
            <!-- Message History Tab -->
            {#if viewingMessageDetails}
              <div>
                <button class="btn btn-link btn-sm text-decoration-none p-0 mb-2 text-muted" onclick={() => viewingMessageDetails = null}>
                  <i class="bi bi-chevron-left me-1"></i> Back to list
                </button>
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="badge {viewingMessageDetails.messageType === 'Complaint' ? 'bg-danger' : 'bg-info'} rounded-pill">
                    {viewingMessageDetails.messageType}
                  </span>
                  {#if viewingMessageDetails.status === 'Verified'}
                    <span class="badge bg-success rounded-pill"><i class="bi bi-patch-check-fill me-1"></i> Verified</span>
                  {:else if viewingMessageDetails.status === 'Rejected'}
                    <span class="badge bg-danger rounded-pill"><i class="bi bi-x-circle-fill me-1"></i> Rejected</span>
                  {:else}
                    <span class="badge bg-warning text-dark rounded-pill"><i class="bi bi-hourglass-split me-1"></i> Pending</span>
                  {/if}
                </div>
                <h6 class="fw-bold text-dark mb-1">{viewingMessageDetails.subject || '(No Subject)'}</h6>
                <span class="text-muted small d-block mb-2" style="font-size:0.75rem;">
                  <i class="bi bi-calendar3 me-1"></i> {formatDate(viewingMessageDetails.createdAt)}
                </span>
                <div class="p-2 rounded-3 bg-light border text-dark small" style="white-space: pre-wrap; max-height: 160px; overflow-y: auto;">
                  {viewingMessageDetails.message}
                </div>
              </div>
            {:else if messagesLoading}
              <div class="text-center py-4">
                <div class="spinner-border spinner-border-sm text-warning" role="status"></div>
                <p class="text-muted small mt-2 mb-0">Loading messages...</p>
              </div>
            {:else if userMessages.length === 0}
              <div class="text-center py-4">
                <i class="bi bi-chat-square-heart text-muted fs-3"></i>
                <p class="text-muted small mt-2 mb-0">No messages submitted yet.</p>
                <button class="btn btn-link btn-sm mt-1" onclick={() => chatTab = 'new'}>Send your first message</button>
              </div>
            {:else}
              <div class="d-flex flex-column gap-2">
                {#each userMessages as item}
                  <button
                    type="button"
                    class="p-2 rounded-3 border bg-light position-relative hover-shadow text-start w-100"
                    onclick={() => viewingMessageDetails = item}
                  >
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <span class="badge {item.messageType === 'Complaint' ? 'bg-danger bg-opacity-10 text-danger border border-danger-subtle' : 'bg-info bg-opacity-10 text-info border border-info-subtle'} rounded-pill" style="font-size:0.68rem;">
                        {item.messageType}
                      </span>
                      {#if item.status === 'Verified'}
                        <span class="badge bg-success rounded-pill" style="font-size:0.68rem;"><i class="bi bi-check-lg"></i> Verified</span>
                      {:else if item.status === 'Rejected'}
                        <span class="badge bg-danger rounded-pill" style="font-size:0.68rem;"><i class="bi bi-x"></i> Rejected</span>
                      {:else}
                        <span class="badge bg-warning text-dark rounded-pill" style="font-size:0.68rem;"><i class="bi bi-clock"></i> Pending</span>
                      {/if}
                    </div>
                    <strong class="text-dark d-block text-truncate small mb-1">{item.subject || '(No Subject)'}</strong>
                    <span class="text-muted small d-block" style="font-size:0.72rem;">{formatDate(item.createdAt)}</span>
                  </button>
                {/each}
              </div>
            {/if}
          {/if}
        </div>
      </div>
    {/if}

    <!-- Oval Shape Contact Admin Floating Button -->
    <button
      type="button"
      class="floating-oval-btn shadow-lg"
      onclick={toggleChatboxPopup}
      title="Contact Admin Chatbox"
      aria-expanded={chatboxPopupOpen}
    >
      <i class="bi bi-chat-dots-fill me-2 fs-5"></i>
      <span class="fw-bold">Contact Admin</span>
    </button>
  </aside>
</main>

<Footer />

<style>
  /* Floating Oval Shape Contact Admin Button & Popup */
  .floating-chatbox-container {
    position: fixed;
    bottom: 25px;
    right: 25px;
    z-index: 1050;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .floating-oval-btn {
    background-color: #ffc107;
    color: #1e293b;
    border: none;
    border-radius: 50px; /* Oval shape */
    padding: 12px 24px;
    font-size: 0.95rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.25s ease-in-out;
    box-shadow: 0 8px 24px rgba(255, 193, 7, 0.45);
    outline: none;
  }

  .floating-oval-btn:hover {
    background-color: #ffca2c;
    color: #0f172a;
    transform: translateY(-3px) scale(1.03);
    box-shadow: 0 12px 28px rgba(255, 193, 7, 0.6);
  }

  .floating-oval-btn:active {
    transform: translateY(0) scale(0.98);
  }

  .chatbox-card {
    width: 320px;
    max-width: calc(100vw - 40px);
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.18) !important;
  }

  .animate-slide-up {
    animation: slideUpFade 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes slideUpFade {
    from {
      opacity: 0;
      transform: translateY(16px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (max-width: 576px) {
    .floating-chatbox-container {
      bottom: 15px;
      right: 15px;
    }
    .floating-oval-btn {
      padding: 10px 20px;
      font-size: 0.88rem;
    }
    .chatbox-card {
      width: calc(100vw - 30px);
    }
  }
</style>
