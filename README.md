# V4L - Vocal 4 Local

**Connecting Local Businesses with Local Customers**

V4L is a cross-platform application available on iOS, Android, and web (v4l.app) that brings together local businesses and their community through an offline-first, multi-organization platform.

## 🌟 Features

- **Username-based Authentication** - Simple login without requiring email
- **Multi-Organization Support** - Manage multiple businesses or join multiple communities
- **Offline-First Architecture** - Works seamlessly even without internet connection
- **Cross-Platform** - Available on iOS, Android, and Web (v4l.app)
- **Real-time Sync** - PouchDB + CouchDB for seamless data synchronization
- **PWA Support** - Install as app on any device from v4l.app

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- For mobile development:
  - Android Studio (for Android)
  - Xcode (for iOS, macOS only)

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd bmpa

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser at http://localhost:5173
```

### 🔧 Mock Mode (No Backend Required)

The app includes a **mock authentication service** that allows you to test the entire UI without running a backend server!

**Features:**
- Automatic fallback when backend is unavailable
- Full registration, login, and password reset flows
- In-memory user storage (resets on page refresh)
- Purple banner at the top indicates mock mode

**How it works:**
1. In development mode (`npm run dev`), mock mode is enabled by default
2. Try registering a new user - it works without any backend!
3. Login with the username/password you registered
4. Test password reset with security questions
5. All data is stored in browser memory (lost on refresh)

**To use the real backend:**
Set up your backend API and update `.env`:
```bash
VITE_DEBUG=false
VITE_AUTH_API_URL=https://api.v4l.app/api/auth
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# API Configuration
VITE_AUTH_API_URL=https://api.v4l.app/api/auth
VITE_COUCHDB_URL=https://db.v4l.app
VITE_COUCHDB_USE_SSL=true

# App Configuration
VITE_APP_URL=https://v4l.app
```

## 📱 Mobile Development

### Build for Android

```bash
# Add Android platform
npm run add:android

# Sync web assets
npm run sync

# Open in Android Studio
npm run open:android
```

### Build for iOS

```bash
# Add iOS platform (macOS only)
npm run add:ios

# Sync web assets
npm run sync

# Open in Xcode
npm run open:ios
```

## 🌐 Web Deployment

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

### Deploy to v4l.app

The `dist` folder contains the production build. Deploy to any static hosting:

#### Using Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### Using Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Using Traditional Hosting

Upload the contents of the `dist` folder to your web server.

**Important:** Configure your web server to redirect all requests to `index.html` for SPA routing.

**Nginx Configuration:**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

**Apache Configuration (.htaccess):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## 🏗️ Project Structure

```
v4l/
├── src/
│   ├── css/
│   │   └── app.css           # Application styles
│   ├── js/
│   │   ├── config/
│   │   │   ├── constants.js  # App constants
│   │   │   └── env.js        # Environment configuration
│   │   ├── pages/
│   │   │   ├── login-page.js
│   │   │   ├── register-page.js
│   │   │   ├── password-reset-page.js
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── auth-service.js
│   │   │   ├── storage-service.js
│   │   │   └── db-manager.js
│   │   ├── state/
│   │   │   ├── auth-state.js
│   │   │   └── org-state.js
│   │   ├── utils/
│   │   │   ├── validators.js
│   │   │   └── helpers.js
│   │   ├── app.js            # Main application entry
│   │   └── router.js         # Client-side router
│   └── index.html            # HTML entry point
├── public/
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker
│   ├── robots.txt            # SEO robots file
│   └── sitemap.xml           # SEO sitemap
├── capacitor.config.ts       # Capacitor configuration
├── package.json
└── vite.config.js
```

## 🔐 Authentication

V4L uses a username-based authentication system with the following features:

- **Username Login** - No email required for basic signup
- **Optional Email/Phone** - Users can add contact info for recovery
- **Security Questions** - 3-5 predefined questions for password reset when email not provided
- **JWT Tokens** - Access + Refresh token pattern for secure API access

## 📊 Database Architecture

### Users Database
- Separate `v4l_users` CouchDB database
- Stores user credentials and security questions
- Hashed passwords using bcrypt

### Multi-Tenant Strategy
- **Shared DB:** Small organizations (<50 members) - `v4l_orgs_shard_*`
- **Dedicated DB:** Large organizations (50+ members) - `v4l_org_{orgId}`
- **Reference DB:** Common data for all users - `v4l_shared`

## 🔄 Sync Strategy

- **On Change:** Immediate push to CouchDB on local data changes
- **Periodic Pull:** Pull from CouchDB every 60 seconds
- **Conflict Resolution:** Last-write-wins with CouchDB revision tracking
- **Offline Support:** Queue writes when offline, sync when connection restored

## 🎨 Tech Stack

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **Ionic Components** - Mobile-optimized UI components
- **Vite** - Fast build tool and dev server

### Mobile
- **Capacitor 6** - Cross-platform native runtime
- **iOS** - Native iOS wrapper
- **Android** - Native Android wrapper

### Data Layer
- **PouchDB** - Client-side database with IndexedDB
- **CouchDB** - Server-side database with replication
- **Capacitor Preferences** - Secure native storage for tokens

### PWA
- **Service Worker** - Offline support and caching
- **Web App Manifest** - Install prompt and app-like experience
- **Responsive Design** - Works on all screen sizes

## 🚀 Development Status

### ✅ Phase 1: Foundation - COMPLETE
- Project setup and configuration
- State management system
- Client-side routing
- Storage service

### ✅ Phase 2: Authentication - COMPLETE
- Username-based registration
- Login/logout flow
- Password reset (email + security questions)
- Multi-step registration form
- JWT token management

### 📍 Phase 3: Database Layer - IN PROGRESS
- [ ] Implement DatabaseManager
- [ ] Implement SyncManager
- [ ] Multi-organization database setup
- [ ] Offline sync implementation

### Phase 4: Core Features - PLANNED
- [ ] Dashboard with org switching
- [ ] Organization management
- [ ] Member management
- [ ] Activity feed
- [ ] Search and discovery

### Phase 5: Web Optimization - PLANNED
- [ ] SEO optimization
- [ ] Performance optimization
- [ ] Analytics integration
- [ ] Social media integration

## 📝 SEO & Web Optimization

The web application at v4l.app includes:

- **Meta Tags** - Proper description, keywords, and social media tags
- **PWA Manifest** - Installable as native-like app
- **Service Worker** - Offline support and performance
- **Sitemap** - XML sitemap for search engines
- **Robots.txt** - Search engine crawling rules
- **Open Graph** - Rich social media previews

## 🔒 Security

- **Password Hashing:** bcrypt on backend with salt
- **Security Questions:** Hashed answers for recovery
- **JWT Tokens:** Short-lived access tokens (15 min), long-lived refresh tokens
- **HTTPS Only:** All production traffic encrypted
- **Input Validation:** Client and server-side validation
- **XSS Prevention:** Proper escaping and sanitization

## 📦 Dependencies

```json
{
  "dependencies": {
    "@capacitor/android": "^6.0.0",
    "@capacitor/app": "^6.0.0",
    "@capacitor/core": "^6.0.0",
    "@capacitor/ios": "^6.0.0",
    "@capacitor/network": "^6.0.0",
    "@capacitor/preferences": "^6.0.0",
    "@ionic/core": "^8.0.0",
    "pouchdb": "^8.0.1",
    "pouchdb-find": "^8.0.1"
  }
}
```

## 📱 Progressive Web App

Visit **v4l.app** on any device to:
- Install as native app
- Work offline
- Receive push notifications
- Access from home screen

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📧 Support

For support:
- Email: support@v4l.app
- Web: https://v4l.app/support

## 📄 License

MIT License - See LICENSE file for details

---

**V4L** - Built with ❤️ for local communities

**Mission:** Empowering local businesses to connect authentically with their community, making every voice heard and every transaction meaningful.
