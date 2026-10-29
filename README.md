# SonaInfo – College Student Information & News Sharing Application

A modern, responsive campus information and news sharing platform built with **SvelteKit**, **Bootstrap 5**, and **Firebase** (Authentication, Firestore, and Storage).

---

## 🚀 Tech Stack

- **Frontend Framework**: [SvelteKit](https://kit.svelte.dev/) + [Svelte 5](https://svelte.dev/)
- **UI & Styling**: [Bootstrap 5](https://getbootstrap.com/) + Custom CSS (Day/Night mode)
- **Icons**: Bootstrap Icons
- **Backend / Services**:
  - **Firebase Authentication**: User & Admin authentication
  - **Firebase Firestore**: Realtime collections for Users, News, Categories, and Applications
  - **Firebase Storage**: Image file uploads and URLs
- **Dev Environment**: VS Code / Vite

---

## 📁 Project Structure

```
svelte-sonainfo/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Navbar.svelte         # Global navbar with role-aware actions & Day/Night switcher
│   │   │   ├── Footer.svelte         # Responsive footer
│   │   │   └── AdminSidebar.svelte   # Admin panel navigation sidebar
│   │   ├── firebase.js               # Firebase Client SDK initialization
│   │   ├── firebaseService.js        # Auth, Firestore CRUD, and Storage service methods
│   │   └── stores.js                 # Svelte stores for theme and date formatting helpers
│   ├── routes/
│   │   ├── +layout.svelte            # Root layout with theme initialization
│   │   ├── +page.svelte              # Homepage (Hero, Quick Services, Featured News)
│   │   ├── login/                    # Dual context login (Student & Admin)
│   │   ├── register/                 # Student registration
│   │   ├── news/                     # News feed with Search, Category Filter, and Sorting
│   │   ├── news/[id]/                # News details page with Gmail application workflow
│   │   ├── dashboard/                # Student Dashboard with live metrics
│   │   ├── share-news/               # Share news page with image upload
│   │   ├── my-news/                  # Student's own submissions with preview modal
│   │   └── admin/
│   │       ├── dashboard/            # Admin dashboard metrics and recent submissions
│   │       ├── pending/              # Approval / Rejection review workflow
│   │       ├── news/                 # News CRUD management
│   │       ├── categories/           # Category management
│   │       ├── users/                # User account status management
│   │       └── applications/         # Verified applications log
│   └── app.html                      # Root HTML template with Bootstrap 5
├── static/                           # Static assets, logos, and stylesheets
└── vite.config.js                    # Vite & SvelteKit configuration
```

---

## 🛠️ How to Run Locally in VS Code

1. **Open the project folder**:
   ```bash
   cd d:\SONAINFO\svelte-sonainfo
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

4. **Build for production**:
   ```bash
   npm run build
   npm run preview
   ```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@sonainfo.edu` | `admin123` |
| **Student** | `student@sonainfo.edu` | `student123` |

*(One-click auto-fill buttons are provided on the login page for rapid testing)*
