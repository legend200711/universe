/**
 * Firebase Service Layer
 * All Firestore interactions go here — never scattered through UI code.
 * Replace firebase-config.js placeholders before using.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

import { firebaseConfig, OWNER_EMAIL } from '../firebase-config.js';

// ── Initialise Firebase ───────────────────────────────────────────
let app, auth, db;

function ensureInit() {
  if (!app) {
    if (firebaseConfig.apiKey === 'REPLACE_WITH_YOUR_API_KEY') {
      throw new Error('Firebase is not configured yet. Edit universe/firebase-config.js with your real credentials.');
    }
    app  = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db   = getFirestore(app);
  }
}

// ── Auth ──────────────────────────────────────────────────────────
export async function login(email, password) {
  ensureInit();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  if (cred.user.email !== OWNER_EMAIL) {
    await signOut(auth);
    throw new Error('Access denied.');
  }
  return cred.user;
}

export async function logout() {
  ensureInit();
  return signOut(auth);
}

export function onAuthChange(callback) {
  ensureInit();
  return onAuthStateChanged(auth, callback);
}

export function currentUser() {
  return auth ? auth.currentUser : null;
}

// ── Generic helpers ───────────────────────────────────────────────
function colRef(name) {
  ensureInit();
  return collection(db, name);
}

function docRef(collName, id) {
  ensureInit();
  return doc(db, collName, id);
}

// ── Websites ──────────────────────────────────────────────────────
export async function getPublishedWebsites() {
  ensureInit();
  const q = query(colRef('websites'), where('published', '==', true), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllWebsites() {
  ensureInit();
  const q = query(colRef('websites'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveWebsite(data, id = null) {
  ensureInit();
  const payload = { ...data, updatedAt: serverTimestamp() };
  if (id) {
    await updateDoc(docRef('websites', id), payload);
    return id;
  } else {
    payload.createdAt = serverTimestamp();
    const ref = await addDoc(colRef('websites'), payload);
    return ref.id;
  }
}

export async function publishWebsite(id, published) {
  ensureInit();
  await updateDoc(docRef('websites', id), { published, updatedAt: serverTimestamp() });
}

export async function deleteWebsite(id) {
  ensureInit();
  await deleteDoc(docRef('websites', id));
}

// ── Projects ──────────────────────────────────────────────────────
export async function getPublishedProjects() {
  ensureInit();
  const q = query(colRef('projects'), where('published', '==', true), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllProjects() {
  ensureInit();
  const q = query(colRef('projects'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveProject(data, id = null) {
  ensureInit();
  const payload = { ...data, updatedAt: serverTimestamp() };
  if (id) {
    await updateDoc(docRef('projects', id), payload);
    return id;
  } else {
    payload.createdAt = serverTimestamp();
    const ref = await addDoc(colRef('projects'), payload);
    return ref.id;
  }
}

export async function publishProject(id, published) {
  ensureInit();
  await updateDoc(docRef('projects', id), { published, updatedAt: serverTimestamp() });
}

export async function deleteProject(id) {
  ensureInit();
  await deleteDoc(docRef('projects', id));
}

// ── Announcements ─────────────────────────────────────────────────
export async function getPublishedAnnouncements() {
  ensureInit();
  const q = query(colRef('announcements'), where('published', '==', true), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllAnnouncements() {
  ensureInit();
  const snap = await getDocs(query(colRef('announcements'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveAnnouncement(data, id = null) {
  ensureInit();
  const payload = { ...data, updatedAt: serverTimestamp() };
  if (id) {
    await updateDoc(docRef('announcements', id), payload);
    return id;
  } else {
    payload.createdAt = serverTimestamp();
    const ref = await addDoc(colRef('announcements'), payload);
    return ref.id;
  }
}

export async function publishAnnouncement(id, published) {
  ensureInit();
  await updateDoc(docRef('announcements', id), { published, updatedAt: serverTimestamp() });
}

export async function deleteAnnouncement(id) {
  ensureInit();
  await deleteDoc(docRef('announcements', id));
}

// ── Settings ──────────────────────────────────────────────────────
export async function getSettings() {
  ensureInit();
  const snap = await getDoc(docRef('settings', 'global'));
  return snap.exists() ? snap.data() : {};
}

export async function saveSettings(data) {
  ensureInit();
  await setDoc(docRef('settings', 'global'), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}
