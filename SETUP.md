# Chris Legend of Shadows Universe — Setup Guide

## Project Structure

```
universe/
├── index.html              ← Public homepage (cinematic gateway)
├── manifest.json           ← PWA manifest
├── sw.js                   ← Service worker (offline + caching)
├── firebase-config.js      ← ⚠ Firebase credentials (YOU MUST FILL THIS IN)
├── firestore.rules         ← Firestore Security Rules (deploy to Firebase)
│
├── css/
│   ├── main.css            ← Public site styles
│   └── admin.css           ← Admin dashboard styles
│
├── js/
│   ├── app.js              ← Public app logic
│   ├── canvas.js           ← Cinematic visual engine (rain/lightning/crows)
│   └── firebase-service.js ← All Firestore/Auth interactions
│
├── admin/
│   ├── index.html          ← Private owner dashboard
│   └── admin.js            ← Admin CRUD logic
│
└── icons/
    ├── icon.svg            ← Source icon
    ├── icon-72.png
    ├── icon-96.png
    ├── icon-128.png
    ├── icon-192.png
    └── icon-512.png
```

---

## Step 1 — Create Your Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **Add project** → Name it `chris-legend-universe` (or anything you like)
3. Disable Google Analytics if you don't need it → **Create project**

---

## Step 2 — Add a Web App

1. In your project dashboard → click the **Web** icon (`</>`)
2. App nickname: `Universe`
3. **Do NOT** check "Firebase Hosting" at this stage (optional later)
4. Click **Register app**
5. Copy the `firebaseConfig` object — it looks like:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

6. Open `universe/firebase-config.js` and replace every `REPLACE_WITH_YOUR_...` value with your real values.

---

## Step 3 — Enable Email/Password Authentication

1. Firebase Console → **Authentication** → **Sign-in method**
2. Click **Email/Password** → Enable → **Save**

---

## Step 4 — Create Your Owner Account

1. Firebase Console → **Authentication** → **Users** → **Add user**
2. Email: `christijerina46@gmail.com`
3. Set your **private password** here (this is the ONLY place you ever set it)
4. Click **Add user**

⚠ **NEVER put your password anywhere in the source code.**

---

## Step 5 — Enable Firestore

1. Firebase Console → **Firestore Database** → **Create database**
2. Choose **Production mode** (starts locked)
3. Pick your closest region → **Done**

---

## Step 6 — Deploy Firestore Security Rules

1. Firebase Console → **Firestore** → **Rules** tab
2. Replace the entire content with the contents of `universe/firestore.rules`
3. Click **Publish**

The rules ensure:
- Public visitors: read-only on `published == true` documents
- Owner only: full create/update/delete
- No unauthenticated writes ever

---

## Step 7 — Deploy Your Website

### Option A — Firebase Hosting (recommended)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Set public directory to: universe
# Configure as SPA: No
# Deploy:
firebase deploy --only hosting
```

### Option B — Any Static Host

Upload the entire `universe/` folder to:
- GitHub Pages
- Netlify
- Vercel
- Your own server

For the service worker to work correctly, the site must be served over **HTTPS**.

Update the `start_url` and `scope` in `manifest.json` to match your actual domain.

---

## Step 8 — PWA Icons

Icons are already generated in `universe/icons/`. If you want a custom icon:
1. Replace `icon.svg` with your own SVG
2. Run: `rsvg-convert -w 192 -h 192 icon.svg -o icon-192.png` (etc.)
3. Or use https://www.pwabuilder.com/imageGenerator

---

## Firestore Data Structure

```
/websites/{id}
  name:        string   ← Portal display name
  url:         string   ← Full https:// URL
  description: string
  category:    string   ← Music | Social | Media | Creative | Future | Other
  status:      string   ← "live" | "soon"
  icon:        string   ← Emoji e.g. "🎵"
  bgImage:     string   ← Optional https:// background image URL
  order:       number   ← Sort order (lower = first)
  featured:    boolean
  published:   boolean  ← TRUE = visible publicly, FALSE = draft
  createdAt:   timestamp
  updatedAt:   timestamp

/projects/{id}
  (same fields as websites)

/announcements/{id}
  text:      string   ← Ticker message text
  published: boolean
  createdAt: timestamp
  updatedAt: timestamp

/settings/global
  siteTitle:   string
  tagline:     string
  openNewTab:  boolean
  updatedAt:   timestamp
```

---

## Step 9 — Add Your First Website Portal

1. Go to `yoursite.com/admin/` (or open `admin/index.html` locally)
2. Enter your password
3. Click **Websites** in the sidebar
4. Click **+ Add Website**
5. Fill in:
   - Name: `Aurenix`
   - URL: `https://youraurenixsite.com`
   - Category: `Music`
   - Status: Live ✓ (toggle on)
   - Description: Your description
   - Order: `1`
6. Click **Save**
7. Click **Publish** on the row → it instantly appears on the public homepage

---

## Step 10 — Test Public + Admin Views

**Public test:**
- Open `index.html` → intro screen appears
- Click "Enter the Universe" → main page loads
- Portals show your published websites
- Reduce Motion button toggles visual effects
- On mobile: hamburger menu works, portals stack to single column
- PWA install prompt appears on supported browsers

**Admin test:**
- Open `admin/index.html`
- Login with your email/password
- Add, edit, publish, unpublish, delete portals
- Changes appear immediately on the public side (real-time via Firestore)
- Logout returns to login screen

---

## Security Notes

- Passwords are **never** in source code — set only via Firebase Console
- `firebase-config.js` contains only your **API key** and project ID — these are safe to be in frontend code (Firebase restricts them by domain/rules)
- Firestore Security Rules enforce server-side: public can only read `published == true`, only owner can write
- The admin panel is just a UI — all write attempts by non-owners are rejected at the database level
- URLs are validated before saving (must be http:// or https://)
- All user content is HTML-escaped before rendering

---

## Customising Visual Effects

- **Disable all effects:** Click "Reduce Motion" in the top nav
- **Preference saved:** localStorage key `cls_reduce_motion`
- **OS preference:** respects `prefers-reduced-motion` automatically
- **Low-end devices:** canvas automatically reduces rain/particle/crow count

---

## Adding Future "Coming Soon" Portals

1. Admin → Websites → + Add Website
2. Leave URL blank
3. Status: Coming Soon (toggle off)
4. Publish it → appears as a locked portal 🔒
5. When ready: Edit → add URL → set Status to Live → Save
6. The portal automatically becomes an active "Enter World" button

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Firebase not configured" warning | Fill in `firebase-config.js` with your real credentials |
| Login fails | Verify the user exists in Firebase Console → Authentication |
| Portals don't appear after publish | Check Firestore rules are deployed, check `published == true` |
| PWA not installable | Must be served over HTTPS; check manifest.json `start_url` matches your domain |
| Icons missing | Run icon generation script or upload icons to `universe/icons/` |
| Service worker not updating | Increment `CACHE_NAME` version in `sw.js`, redeploy |
