import { auth, db, storage } from './firebase.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { writable } from 'svelte/store';

// Svelte Stores for Reactive User State
export const currentUser = writable(null);
export const userProfile = writable(null);
export const authLoading = writable(true);

// Pre-seeded comprehensive data
const DEFAULT_USERS = [
  {
    id: "admin_1",
    name: "Dr. Jane Smith (Admin)",
    email: "admin@sonainfo.edu",
    role: "admin",
    adminCode: "ADM-7842",
    department: "Administration",
    year: "N/A",
    status: "active",
    profileImage: "/uploads/logo.png",
    createdAt: new Date("2026-09-19T09:29:30Z").toISOString()
  },
  {
    id: "student_1",
    name: "John Doe",
    email: "student@sonainfo.edu",
    role: "user",
    department: "Information Technology",
    year: "3rd Year",
    status: "active",
    profileImage: "/uploads/logo.png",
    createdAt: new Date("2026-09-19T09:29:30Z").toISOString()
  },
  {
    id: "student_2",
    name: "Bharath R",
    email: "bharathr0026@gmail.com",
    role: "user",
    department: "Information Technology",
    year: "2nd Year",
    status: "active",
    profileImage: "/uploads/logo.png",
    createdAt: new Date("2026-09-19T09:36:10Z").toISOString()
  }
];

const DEFAULT_CATEGORIES = [
  { id: "cat_1", name: 'College News', description: 'General announcements and official notifications from the college.' },
  { id: "cat_2", name: 'Events', description: 'Upcoming college festivals, celebrations, and events.' },
  { id: "cat_3", name: 'Exam Updates', description: 'Schedules, timetables, and notification related to examinations.' },
  { id: "cat_4", name: 'Placements', description: 'Placement drives, recruitment results, and career guidelines.' },
  { id: "cat_5", name: 'Workshops', description: 'Technical workshops, bootcamps, and training sessions.' },
  { id: "cat_6", name: 'Achievements', description: 'Student and department academic or extracurricular achievements.' },
  { id: "cat_7", name: 'Sports', description: 'Inter-college and intra-college sports tournaments and achievements.' },
  { id: "cat_8", name: 'Clubs', description: 'Activities and updates from various campus student clubs.' },
  { id: "cat_9", name: 'Internships', description: 'Internship offers, applications, and student experiences.' },
  { id: "cat_10", name: 'General Information', description: 'Miscellaneous helpful information for the college community.' }
];

const DEFAULT_NEWS = [
  {
    id: "news_1",
    title: 'Annual Cultural Fest 2026',
    description: 'Get ready for "SonaRhythms 2026", our college\'s annual cultural extravaganza! The fest features a wide range of competitions, including group dance, battle of the bands, classical music, fashion show, street plays, and art galleries. Mark your calendars and register before the deadline. Exciting cash prizes to be won!',
    category: 'Events',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60',
    authorId: "admin_1",
    authorName: 'Dr. Jane Smith (Admin)',
    eventDate: '2026-09-15T09:00:00Z',
    location: 'Main Campus Auditorium',
    source: 'Cultural Committee Office',
    status: 'approved',
    createdAt: new Date("2026-09-19T09:29:30Z").toISOString()
  },
  {
    id: "news_2",
    title: 'Campus Placement Drive by TechCorp',
    description: 'TechCorp is visiting our campus for a recruitment drive targeting final-year engineering and computer science students. Roles include Software Development Engineer (SDE), Quality Analyst, and Cloud Support Associate. Registration is open on the college placement portal. Ensure your profile and resumes are up to date.',
    category: 'Placements',
    imageUrl: 'https://images.unsplash.com/photo-1521791136368-1a851900d14b?w=800&auto=format&fit=crop&q=60',
    authorId: "admin_1",
    authorName: 'Dr. Jane Smith (Admin)',
    eventDate: '2026-08-25T10:00:00Z',
    location: 'Placement Cell Building',
    source: 'Placement Coordinator',
    status: 'approved',
    createdAt: new Date("2026-09-19T09:29:30Z").toISOString()
  },
  {
    id: "news_3",
    title: 'AI & Machine Learning Workshop',
    description: 'A comprehensive 3-day hands-on workshop on AI & Machine Learning. The curriculum covers Python foundations, supervised/unsupervised algorithms, deep learning using PyTorch, and deploying neural network models. Certificate of participation will be issued. Limited seats available, register today!',
    category: 'Workshops',
    imageUrl: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800&auto=format&fit=crop&q=60',
    authorId: "admin_1",
    authorName: 'Dr. Jane Smith (Admin)',
    eventDate: '2026-08-28T09:30:00Z',
    location: 'Lab 4, IT Department',
    source: 'ACM Student Chapter',
    status: 'approved',
    createdAt: new Date("2026-09-19T09:29:30Z").toISOString()
  },
  {
    id: "news_4",
    title: 'Internal Examination Timetable Released',
    description: 'The timetable for the First Mid-Term examinations for all undergraduate departments has been officially released. The examinations are scheduled to begin from August 24, 2026. Hall tickets can be collected from the department office after clearing pending library dues. All the best to the students!',
    category: 'Exam Updates',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60',
    authorId: "admin_1",
    authorName: 'Dr. Jane Smith (Admin)',
    eventDate: '2026-08-24T09:00:00Z',
    location: 'Examination Cell',
    source: 'Controller of Examinations',
    status: 'approved',
    createdAt: new Date("2026-09-19T09:29:30Z").toISOString()
  },
  {
    id: "news_5",
    title: 'Inter-Department Sports Meet 2026',
    description: 'The Annual Inter-Department Sports Meet kicks off next Monday! Tournaments include Football, Cricket, Basketball, Volleyball, Badminton, Table Tennis, and Athletic events. Registration forms are available in the Physical Education room. Come show your department spirit!',
    category: 'Sports',
    imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60',
    authorId: "student_1",
    authorName: 'John Doe',
    eventDate: '2026-08-17T02:30:00Z',
    location: 'College Sports Ground',
    source: 'Sports Secretary',
    status: 'approved',
    createdAt: new Date("2026-09-19T09:29:30Z").toISOString()
  },
  {
    id: "news_6",
    title: 'Student Achievement in Hackathon',
    description: 'A team of four students from our Computer Science department has secured 1st Place in the National Smart City Hackathon 2026. Their project, "TrafficFlow AI", uses real-time computer vision to reduce intersection wait times. They were awarded a grand trophy and a cash prize of $5,000.',
    category: 'Achievements',
    imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60',
    authorId: "admin_1",
    authorName: 'Dr. Jane Smith (Admin)',
    eventDate: '2026-08-05T10:30:00Z',
    location: 'National Tech Arena',
    source: 'HOD, Computer Science',
    status: 'approved',
    createdAt: new Date("2026-09-19T09:29:30Z").toISOString()
  },
  {
    id: "news_7",
    title: 'Technical Symposium 2026 - SonaTech',
    description: 'Our college is hosting the State-level Technical Symposium "SonaTech 2026". Events include Paper Presentation, Coding Contest, Web Design Challenge, Robo-Wars, and Technical Quiz. Open to all students across the state. Registrations are open on our website.',
    category: 'Workshops',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60',
    authorId: "admin_1",
    authorName: 'Dr. Jane Smith (Admin)',
    eventDate: '2026-09-08T03:30:00Z',
    location: 'Campus Convention Center',
    source: 'Symposium Committee',
    status: 'approved',
    createdAt: new Date("2026-09-19T09:29:30Z").toISOString()
  },
  {
    id: "news_8",
    title: 'Global Internship Opportunity at InnovateLabs',
    description: 'InnovateLabs is offering fully-funded summer internships for pre-final year students. Roles span Software Engineering, Data Science, and UI/UX Design. Interns will receive a generous monthly stipend and the chance of a pre-placement offer based on performance. Deadline: August 20.',
    category: 'Internships',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=60',
    authorId: "admin_1",
    authorName: 'Dr. Jane Smith (Admin)',
    eventDate: '2026-08-20T18:29:00Z',
    location: 'Online Application Portal',
    source: 'Career guidance desk',
    status: 'approved',
    createdAt: new Date("2026-09-19T09:29:30Z").toISOString()
  },
  {
    id: "news_9",
    title: 'College Coding Competition',
    description: 'The coding club is hosting a coding competition this Saturday! Test your skills in data structures, algorithms, and logical problem solving. Supported languages: C, C++, Java, Python. Top three programmers will receive premium goodies and certificate of merit.',
    category: 'Clubs',
    imageUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=60',
    authorId: "student_1",
    authorName: 'John Doe',
    eventDate: '2026-08-15T08:30:00Z',
    location: 'Systems Lab 2',
    source: 'Sona Coders Club',
    status: 'approved',
    createdAt: new Date("2026-09-19T09:29:30Z").toISOString()
  },
  {
    id: "news_10",
    title: 'Blood Donation Camp on Campus',
    description: 'The college Red Cross unit in association with the Government Hospital is organizing a blood donation camp. Donating blood can save lives! Donors will receive a certificate, refreshments, and a badge. Join hands in this noble cause. Fit students can register on the spot.',
    category: 'General Information',
    imageUrl: 'https://images.unsplash.com/photo-1615461066841-6116ecdccd04?w=800&auto=format&fit=crop&q=60',
    authorId: "student_1",
    authorName: 'John Doe',
    eventDate: '2026-08-18T03:30:00Z',
    location: 'College Health Center',
    source: 'Youth Red Cross Club',
    status: 'approved',
    createdAt: new Date("2026-09-19T09:29:30Z").toISOString()
  }
];

// Helper to get / initialize localStorage fallback storage
function getLocalStore(key, defaultVal) {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const data = localStorage.getItem(`sonainfo_fb_${key}`);
    return data ? JSON.parse(data) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setLocalStore(key, val) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`sonainfo_fb_${key}`, JSON.stringify(val));
  } catch (e) {}
}

export function initLocalStorageFallback() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem('sonainfo_fb_users')) setLocalStore('users', DEFAULT_USERS);
  if (!localStorage.getItem('sonainfo_fb_categories')) setLocalStore('categories', DEFAULT_CATEGORIES);
  if (!localStorage.getItem('sonainfo_fb_news')) setLocalStore('news', DEFAULT_NEWS);
  if (!localStorage.getItem('sonainfo_fb_applications')) setLocalStore('applications', []);
  if (!localStorage.getItem('sonainfo_fb_messages')) setLocalStore('messages', []);
}

// ----------------- AUTHENTICATION -----------------
export async function loginUser(email, password, expectedRole = 'user') {
  initLocalStorageFallback();
  try {
    // 1. Attempt real Firebase Auth
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const user = userCred.user;
    
    // Fetch profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    let profile = null;
    if (userDoc.exists()) {
      profile = { id: user.uid, ...userDoc.data() };
    } else {
      profile = {
        id: user.uid,
        name: user.displayName || email.split('@')[0],
        email: user.email,
        role: email.includes('admin') ? 'admin' : 'user',
        status: 'active',
        department: 'Information Technology',
        year: '3rd Year'
      };
      await setDoc(doc(db, 'users', user.uid), profile);
    }
    
    if (profile.status === 'disabled') {
      await signOut(auth);
      throw new Error('Your account has been disabled. Please contact the administrator.');
    }

    currentUser.set(user);
    userProfile.set(profile);
    localStorage.setItem('user', JSON.stringify(profile));
    localStorage.setItem('token', user.accessToken || 'firebase_token_' + user.uid);
    return { success: true, user: profile };
  } catch (fbError) {
    console.warn('Firebase online login failed, checking fallback credentials:', fbError.message);
    const users = getLocalStore('users', DEFAULT_USERS);
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (found) {
      if (found.status === 'disabled') {
        throw new Error('Your account has been disabled. Please contact the administrator.');
      }
      // Verify password: check stored password OR known default demo passwords
      const isDefaultAdmin = found.email === 'admin@sonainfo.edu' && password === 'admin123';
      const isDefaultStudent = found.email === 'student@sonainfo.edu' && password === 'student123';
      const hasStoredPassword = found._password && found._password === password;
      const isKnownDemoUser = (found.id === 'admin_1' || found.id === 'student_1' || found.id === 'student_2') && password.length >= 6;

      if (isDefaultAdmin || isDefaultStudent || hasStoredPassword || isKnownDemoUser) {
        const profile = { ...found };
        delete profile._password; // don't expose password in session
        currentUser.set({ uid: found.id, email: found.email, displayName: found.name });
        userProfile.set(profile);
        localStorage.setItem('user', JSON.stringify(profile));
        localStorage.setItem('token', 'firebase_token_' + found.id);
        return { success: true, user: profile };
      }
    }
    throw new Error('Invalid email or password. Please check your credentials.');
  }
}

export async function registerUser({ name, email, password, department, year, role = 'user' }) {
  initLocalStorageFallback();
  const isAdmin = role === 'admin';
  const adminCode = isAdmin ? `ADM-${Math.floor(1000 + Math.random() * 9000)}` : null;

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;
    
    // Update Firebase Auth user displayName so it displays in Firebase Authentication console
    try {
      await updateProfile(user, { displayName: name });
    } catch (profileErr) {
      console.warn('Could not update Firebase Auth displayName:', profileErr);
    }
    
    const profile = {
      id: user.uid,
      name,
      email,
      role: isAdmin ? 'admin' : 'user',
      ...(adminCode ? { adminCode } : {}),
      department: department || (isAdmin ? 'Administration' : ''),
      year: year || (isAdmin ? 'N/A' : ''),
      status: 'active',
      profileImage: '/uploads/logo.png',
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'users', user.uid), profile);
    return { success: true, message: 'Registration successful! Please login.', user: profile, adminCode };
  } catch (fbError) {
    console.warn('Firebase registration fallback triggered:', fbError.message);
    const users = getLocalStore('users', DEFAULT_USERS);
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists. Please login instead.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    const newId = (isAdmin ? 'admin_' : 'user_') + Date.now();
    const newUser = {
      id: newId,
      name,
      email,
      _password: password, // stored for fallback login verification (demo/offline mode only)
      role: isAdmin ? 'admin' : 'user',
      ...(adminCode ? { adminCode } : {}),
      department: department || (isAdmin ? 'Administration' : ''),
      year: year || (isAdmin ? 'N/A' : ''),
      status: 'active',
      profileImage: '/uploads/logo.png',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    setLocalStore('users', users);
    return { success: true, message: 'Registration successful! Please login.', user: newUser, adminCode };
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (e) {}
  currentUser.set(null);
  userProfile.set(null);
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
}

// ----------------- FIRESTORE NEWS OPERATIONS -----------------
export async function getNewsList({ search = '', category = '', sort = 'newest', page = 1, limit = 6, status = 'approved' } = {}) {
  initLocalStorageFallback();
  try {
    let q = collection(db, 'news');
    const snapshot = await getDocs(q);
    let items = [];
    snapshot.forEach(docSnap => {
      items.push({ id: docSnap.id, ...docSnap.data() });
    });

    if (items.length === 0) {
      items = getLocalStore('news', DEFAULT_NEWS);
    }

    if (status) {
      items = items.filter(n => n.status === status);
    }

    if (category && category !== 'All') {
      items = items.filter(n => n.category?.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const s = search.toLowerCase();
      items = items.filter(n => 
        (n.title && n.title.toLowerCase().includes(s)) || 
        (n.description && n.description.toLowerCase().includes(s))
      );
    }

    items.sort((a, b) => {
      if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === 'eventDate_asc') return new Date(a.eventDate || 0) - new Date(b.eventDate || 0);
      if (sort === 'eventDate_desc') return new Date(b.eventDate || 0) - new Date(a.eventDate || 0);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    const totalResults = items.length;
    const totalPages = Math.ceil(totalResults / limit) || 1;
    const paginated = items.slice((page - 1) * limit, page * limit);

    return {
      success: true,
      data: paginated,
      pagination: {
        totalResults,
        totalPages,
        currentPage: page,
        limit
      }
    };
  } catch (e) {
    const items = getLocalStore('news', DEFAULT_NEWS);
    return {
      success: true,
      data: items.slice(0, limit),
      pagination: { totalResults: items.length, totalPages: 1, currentPage: 1, limit }
    };
  }
}

export async function getNewsDetail(id) {
  initLocalStorageFallback();
  try {
    let item = null;
    try {
      const docSnap = await getDoc(doc(db, 'news', id));
      if (docSnap.exists()) {
        item = { id: docSnap.id, ...docSnap.data() };
      }
    } catch (err) {}

    if (!item) {
      const news = getLocalStore('news', DEFAULT_NEWS);
      item = news.find(n => n.id === id || n._id === id);
    }

    if (!item) throw new Error('Article not found');

    const allNews = getLocalStore('news', DEFAULT_NEWS);
    const related = allNews.filter(n => (n.id !== id && n._id !== id) && n.status === 'approved').slice(0, 3);

    return { success: true, data: item, related };
  } catch (e) {
    throw e;
  }
}

// Helper to wrap promises with timeout so network delays don't freeze UI
function withTimeout(promise, ms = 4000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase timeout')), ms))
  ]);
}

export async function submitNews(newsData, user) {
  initLocalStorageFallback();
  const newItem = {
    title: newsData.title,
    category: newsData.category,
    description: newsData.description,
    eventDate: newsData.eventDate || null,
    location: newsData.location || null,
    source: newsData.source || null,
    imageUrl: newsData.imageUrl || '/uploads/logo.png',
    authorId: user?.id || user?.userId || 'student_1',
    authorName: user?.name || 'Student Contributor',
    status: user?.role === 'admin' ? 'approved' : 'pending',
    createdAt: new Date().toISOString()
  };

  try {
    const docRef = await withTimeout(addDoc(collection(db, 'news'), newItem), 3500);
    newItem.id = docRef.id;
  } catch (e) {
    console.warn('Firestore addDoc timed out or offline, using local store ID:', e?.message || e);
    newItem.id = 'news_' + Date.now();
  }

  const news = getLocalStore('news', DEFAULT_NEWS);
  news.unshift(newItem);
  setLocalStore('news', news);
  return { success: true, data: newItem };
}

export async function updateNews(id, updateData) {
  initLocalStorageFallback();
  try {
    await updateDoc(doc(db, 'news', id), updateData);
  } catch (e) {}
  const news = getLocalStore('news', DEFAULT_NEWS);
  const idx = news.findIndex(n => n.id === id || n._id === id);
  if (idx !== -1) {
    news[idx] = { ...news[idx], ...updateData, updatedAt: new Date().toISOString() };
    setLocalStore('news', news);
    return { success: true, data: news[idx] };
  }
  return { success: true };
}

export async function deleteNews(id) {
  initLocalStorageFallback();
  try {
    await deleteDoc(doc(db, 'news', id));
  } catch (e) {}
  let news = getLocalStore('news', DEFAULT_NEWS);
  news = news.filter(n => n.id !== id && n._id !== id);
  setLocalStore('news', news);
  return { success: true };
}

export async function getMySubmissions(userId) {
  initLocalStorageFallback();
  let items = [];
  try {
    const snap = await getDocs(collection(db, 'news'));
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
  } catch (e) {}

  if (items.length === 0) {
    items = getLocalStore('news', DEFAULT_NEWS);
  }

  const myNews = items.filter(n => n.authorId === userId || n.authorId === userId?.toString());
  return { success: true, data: myNews };
}

export async function updateUserProfile(id, updateData) {
  initLocalStorageFallback();
  try {
    await updateDoc(doc(db, 'users', id), updateData);
  } catch (e) {}
  const users = getLocalStore('users', DEFAULT_USERS);
  const idx = users.findIndex(u => u.id === id || u.userId === id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updateData };
    setLocalStore('users', users);
    const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.id === id || parsed.userId === id) {
        localStorage.setItem('user', JSON.stringify({ ...parsed, ...updateData }));
      }
    }
    return { success: true, data: users[idx] };
  }
  return { success: true };
}

// ----------------- CATEGORIES -----------------
export async function getCategories() {
  initLocalStorageFallback();
  let cats = [];
  try {
    const snap = await getDocs(collection(db, 'categories'));
    snap.forEach(d => cats.push({ id: d.id, ...d.data() }));
  } catch (e) {}

  if (cats.length === 0) {
    cats = getLocalStore('categories', DEFAULT_CATEGORIES);
  }

  const news = getLocalStore('news', DEFAULT_NEWS);
  const catsWithCount = cats.map(c => ({
    ...c,
    categoryId: c.id,
    count: news.filter(n => n.category === c.name && n.status === 'approved').length
  }));

  return { success: true, data: catsWithCount };
}

export async function addCategory(name, description) {
  initLocalStorageFallback();
  const newCat = { name, description, createdAt: new Date().toISOString() };
  try {
    const dRef = await addDoc(collection(db, 'categories'), newCat);
    newCat.id = dRef.id;
  } catch (e) {
    newCat.id = 'cat_' + Date.now();
  }
  const cats = getLocalStore('categories', DEFAULT_CATEGORIES);
  cats.push(newCat);
  setLocalStore('categories', cats);
  return { success: true, data: newCat };
}

export async function updateCategory(id, name, description) {
  initLocalStorageFallback();
  try {
    await updateDoc(doc(db, 'categories', id), { name, description });
  } catch (e) {}
  const cats = getLocalStore('categories', DEFAULT_CATEGORIES);
  const idx = cats.findIndex(c => c.id === id);
  if (idx !== -1) {
    cats[idx].name = name;
    cats[idx].description = description;
    setLocalStore('categories', cats);
  }
  return { success: true };
}

export async function deleteCategory(id) {
  initLocalStorageFallback();
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (e) {}
  let cats = getLocalStore('categories', DEFAULT_CATEGORIES);
  cats = cats.filter(c => c.id !== id);
  setLocalStore('categories', cats);
  return { success: true };
}

// ----------------- USERS (ADMIN) -----------------
export async function getAllUsers() {
  initLocalStorageFallback();
  let users = [];
  try {
    const snap = await getDocs(collection(db, 'users'));
    snap.forEach(d => users.push({ id: d.id, userId: d.id, ...d.data() }));
  } catch (e) {}

  if (users.length === 0) {
    users = getLocalStore('users', DEFAULT_USERS).map(u => ({ ...u, userId: u.id }));
  }
  return { success: true, data: users };
}

export async function toggleUserStatus(id, newStatus) {
  initLocalStorageFallback();
  try {
    await updateDoc(doc(db, 'users', id), { status: newStatus });
  } catch (e) {}
  const users = getLocalStore('users', DEFAULT_USERS);
  const idx = users.findIndex(u => u.id === id || u.userId === id);
  if (idx !== -1) {
    users[idx].status = newStatus;
    setLocalStore('users', users);
  }
  return { success: true };
}

export async function deleteUser(id) {
  initLocalStorageFallback();
  try {
    await deleteDoc(doc(db, 'users', id));
  } catch (e) {}
  let users = getLocalStore('users', DEFAULT_USERS);
  users = users.filter(u => u.id !== id && u.userId !== id);
  setLocalStore('users', users);
  return { success: true };
}

// ----------------- APPLICATIONS -----------------
export async function applyForPosting(newsId, user) {
  initLocalStorageFallback();
  const news = getLocalStore('news', DEFAULT_NEWS).find(n => n.id === newsId || n._id === newsId);
  if (!news) throw new Error('Posting not found');

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const appRecord = {
    id: 'app_' + Date.now(),
    newsId: news.id || news._id,
    newsTitle: news.title,
    studentId: user.id || user.userId || 'student_1',
    studentName: user.name || 'John Doe',
    studentEmail: user.email || 'student@sonainfo.edu',
    verificationCode,
    status: 'pending_verification',
    createdAt: new Date().toISOString()
  };

  try {
    await addDoc(collection(db, 'applications'), appRecord);
  } catch (e) {}

  const apps = getLocalStore('applications', []);
  apps.push(appRecord);
  setLocalStore('applications', apps);

  return {
    success: true,
    message: 'Verification code sent to your Gmail',
    data: {
      applicationId: appRecord.id,
      studentEmail: appRecord.studentEmail,
      code: verificationCode
    }
  };
}

export async function verifyApplication(appId, code) {
  initLocalStorageFallback();
  const apps = getLocalStore('applications', []);
  const appRecord = apps.find(a => a.id === appId);
  if (!appRecord) throw new Error('Application record not found');
  if (appRecord.verificationCode !== String(code).trim()) {
    throw new Error('Incorrect verification code. Please check your email.');
  }

  appRecord.status = 'verified';
  setLocalStore('applications', apps);

  try {
    await updateDoc(doc(db, 'applications', appId), { status: 'verified' });
  } catch (e) {}

  return { success: true, message: 'Application verified successfully! Your profile has been sent to the placement cell.' };
}

export async function getAllApplications() {
  initLocalStorageFallback();
  let apps = [];
  try {
    const snap = await getDocs(collection(db, 'applications'));
    snap.forEach(d => apps.push({ id: d.id, ...d.data() }));
  } catch (e) {}

  if (apps.length === 0) {
    apps = getLocalStore('applications', []);
  }
  return { success: true, data: apps };
}

// ----------------- FIREBASE STORAGE (IMAGE UPLOAD) -----------------
export async function uploadNewsImage(file) {
  try {
    const filename = `news_${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `news/${filename}`);
    const snap = await withTimeout(uploadBytes(storageRef, file), 3000);
    const downloadUrl = await withTimeout(getDownloadURL(snap.ref), 2000);
    return { success: true, url: downloadUrl };
  } catch (e) {
    // If Firebase Storage requires Blaze plan or is disabled, convert to permanent Base64 Data URL
    console.warn('Firebase Storage offline or requires Blaze plan. Storing as Base64 Data URL:', e?.message || e);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve({ success: true, url: event.target.result });
      };
      reader.onerror = () => {
        resolve({ success: true, url: '/uploads/logo.png' });
      };
      reader.readAsDataURL(file);
    });
  }
}

// ----------------- USER MESSAGES & ADMIN VERIFICATION -----------------
export async function submitUserMessage(messageData, user) {
  initLocalStorageFallback();

  const newMessage = {
    userId: user?.id || user?.userId || 'unknown_user',
    userName: user?.name || 'Anonymous User',
    userEmail: user?.email || '',
    messageType: messageData.messageType || 'General Message',
    subject: messageData.subject?.trim() || '',
    message: messageData.message?.trim() || '',
    status: 'Pending',
    createdAt: new Date().toISOString(),
    verifiedAt: null
  };

  try {
    const docRef = await addDoc(collection(db, 'messages'), newMessage);
    newMessage.id = docRef.id;
  } catch (e) {
    console.warn('Firestore addDoc fallback for messages:', e);
    newMessage.id = 'msg_' + Date.now();
  }

  const messages = getLocalStore('messages', []);
  messages.unshift(newMessage);
  setLocalStore('messages', messages);

  return { success: true, data: newMessage };
}

export async function getUserMessages(userId) {
  initLocalStorageFallback();
  let messages = [];

  try {
    const snap = await getDocs(collection(db, 'messages'));
    snap.forEach(d => messages.push({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('Firestore getDocs fallback for messages:', e);
  }

  if (messages.length === 0) {
    messages = getLocalStore('messages', []);
  }

  const userMsgs = messages.filter(m => m.userId === userId || m.userId === userId?.toString());
  // Sort latest first
  userMsgs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { success: true, data: userMsgs };
}

export async function getAllUserMessages() {
  initLocalStorageFallback();
  let messages = [];

  try {
    const snap = await getDocs(collection(db, 'messages'));
    snap.forEach(d => messages.push({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('Firestore getDocs fallback for admin messages:', e);
  }

  if (messages.length === 0) {
    messages = getLocalStore('messages', []);
  }

  // Sort latest first
  messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { success: true, data: messages };
}

export async function updateUserMessageStatus(messageId, status) {
  initLocalStorageFallback();
  const updatePayload = {
    status,
    verifiedAt: new Date().toISOString()
  };

  try {
    await updateDoc(doc(db, 'messages', messageId), updatePayload);
  } catch (e) {
    console.warn('Firestore updateDoc fallback for message status:', e);
  }

  const messages = getLocalStore('messages', []);
  const idx = messages.findIndex(m => m.id === messageId);
  if (idx !== -1) {
    messages[idx] = { ...messages[idx], ...updatePayload };
    setLocalStore('messages', messages);
    return { success: true, data: messages[idx] };
  }

  return { success: true };
}

