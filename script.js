import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";

/*
  1. Create a Firebase project.
  2. Enable Authentication > Email/Password.
  3. Create your owner account.
  4. Enable Firestore Database and Storage.
  5. Paste your Firebase web-app configuration below.
  6. Set OWNER_EMAIL to the exact email of your owner account.
*/
// SIMPLE OWNER LOGIN — change these two values to your preferred credentials.
const OWNER_USERNAME = "admin";
const OWNER_PASSWORD = "JDPortfolio2026";

const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");
menuBtn.addEventListener("click", () => nav.classList.toggle("active"));
document.querySelectorAll("#nav a").forEach(a => a.addEventListener("click", () => nav.classList.remove("active")));

document.getElementById("year").textContent = new Date().getFullYear();

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add("show"); });
}, { threshold: .12 });
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

const labels = {
  quiz: "QUIZ", "long-quiz": "LONG QUIZ", midterms: "MIDTERMS",
  finals: "FINALS", activities: "ACTIVITIES", projects: "PROJECTS"
};

function openModal(id) {
  document.getElementById(id).classList.add("open");
  document.getElementById(id).setAttribute("aria-hidden", "false");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
  document.getElementById(id).setAttribute("aria-hidden", "true");
}
document.querySelectorAll("[data-close]").forEach(btn => btn.addEventListener("click", () => closeModal(btn.dataset.close)));

document.querySelectorAll(".view-cat").forEach(btn => {
  btn.addEventListener("click", () => showFiles(btn.dataset.category));
});

async function showFiles(category) {
  openModal("filesModal");
  document.getElementById("modalEyebrow").textContent = labels[category];
  document.getElementById("modalTitle").textContent = `${labels[category]} FILES`;
  const list = document.getElementById("fileList");
  list.innerHTML = `<div class="loading">Loading files...</div>`;
  try {
    const q = query(collection(db, "portfolioFiles"), where("category", "==", category), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) {
      list.innerHTML = `<div class="empty">No files have been published in this category yet.</div>`;
      return;
    }
    list.innerHTML = "";
    snap.forEach(d => {
      const f = d.data();
      const isImage = (f.contentType || "").startsWith("image/");
      const item = document.createElement("div");
      item.className = "file-item";
      item.innerHTML = `
        ${isImage ? `<img class="file-thumb" src="${f.url}" alt="">` : `<div class="file-thumb" style="display:grid;place-items:center;color:#6fc2ff;font-weight:900">FILE</div>`}
        <div class="file-meta"><strong>${escapeHtml(f.title)}</strong><small>${escapeHtml(f.fileName)}</small></div>
        <a class="download" href="${f.url}" target="_blank" rel="noopener" download>View / Download</a>
      `;
      list.appendChild(item);
    });
  } catch (err) {
    list.innerHTML = `<div class="empty">Could not load files. Check your Firebase setup and Firestore rules.</div>`;
    console.error(err);
  }
}

function escapeHtml(value="") {
  return value.replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]));
}

document.getElementById("ownerOpenBtn").addEventListener("click", () => openModal("ownerModal"));

const loginForm = document.getElementById("loginForm");
const authMessage = document.getElementById("authMessage");

function isOwnerLoggedIn() {
  return sessionStorage.getItem("jdOwnerLoggedIn") === "true";
}

function updateOwnerUI() {
  const loggedIn = isOwnerLoggedIn();
  document.getElementById("authArea").classList.toggle("hidden", loggedIn);
  document.getElementById("adminArea").classList.toggle("hidden", !loggedIn);
  if (loggedIn) loadAdminList();
}

loginForm.addEventListener("submit", e => {
  e.preventDefault();
  const username = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (username === OWNER_USERNAME && password === OWNER_PASSWORD) {
    sessionStorage.setItem("jdOwnerLoggedIn", "true");
    authMessage.textContent = "Owner login successful.";
    loginForm.reset();
    updateOwnerUI();
  } else {
    authMessage.textContent = "Invalid owner username or password.";
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("jdOwnerLoggedIn");
  updateOwnerUI();
});

updateOwnerUI();

document.getElementById("uploadForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!isOwnerLoggedIn()) {
    alert("Owner login required.");
    return;
  }

  const category = document.getElementById("uploadCategory").value;
  const title = document.getElementById("uploadTitle").value.trim();
  const file = document.getElementById("uploadFile").files[0];
  const msg = document.getElementById("uploadMessage");
  if (!file) return;
  if (file.size > 25 * 1024 * 1024) {
    msg.textContent = "File is too large. Maximum size is 25 MB.";
    return;
  }

  msg.textContent = "Uploading...";
  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `portfolio/${category}/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file, { contentType: file.type || "application/octet-stream" });
    const url = await getDownloadURL(storageRef);

    await addDoc(collection(db, "portfolioFiles"), {
      title, category, fileName: file.name, contentType: file.type || "",
      size: file.size, url, storagePath: path, createdAt: serverTimestamp(),
    });

    msg.textContent = "Upload successful.";
    e.target.reset();
    loadAdminList();
  } catch (err) {
    msg.textContent = "Upload failed. Check Firebase Storage/Firestore rules.";
    console.error(err);
  }
});

async function loadAdminList() {
  const list = document.getElementById("adminList");
  list.innerHTML = `<div class="loading">Loading...</div>`;
  try {
    const snap = await getDocs(query(collection(db, "portfolioFiles"), orderBy("createdAt", "desc")));
    list.innerHTML = "";
    if (snap.empty) {
      list.innerHTML = `<div class="empty">No uploaded files yet.</div>`;
      return;
    }
    snap.forEach(d => {
      const f = d.data();
      const row = document.createElement("div");
      row.className = "admin-row";
      row.innerHTML = `<span>${escapeHtml(f.title)} <small style="color:#718096">(${labels[f.category] || f.category})</small></span><button class="delete-btn">Delete</button>`;
      row.querySelector("button").addEventListener("click", () => deleteFile(d.id, f.storagePath));
      list.appendChild(row);
    });
  } catch (err) {
    list.innerHTML = `<div class="empty">Unable to load owner files.</div>`;
    console.error(err);
  }
}

async function deleteFile(id, storagePath) {
  if (!confirm("Delete this file from the portfolio?")) return;
  try {
    await deleteDoc(doc(db, "portfolioFiles", id));
    if (storagePath) {
      try { await deleteObject(ref(storage, storagePath)); } catch (e) { console.warn(e); }
    }
    loadAdminList();
  } catch (err) {
    alert("Delete failed. Check your Firebase rules.");
    console.error(err);
  }
}
