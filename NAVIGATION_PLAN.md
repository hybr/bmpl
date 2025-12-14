# V4L Navigation System Plan

## Overview
Two-level navigation system with context-aware bottom tabs:
- **Level 1**: 5 main icons at bottom (always visible)
- **Level 2**: 4 contextual icons + 1 back icon (when Level 1 icon clicked)

## User Roles & Access

### Guest (Not Logged In)
- ✅ Browse all organizations
- ✅ View products/services for sale or rent
- ✅ View open job vacancies
- ✅ View public organization information
- ❌ Cannot order/purchase
- ❌ Cannot apply for jobs
- ❌ Cannot create organizations
- ❌ Cannot access messaging

### Authenticated User
- ✅ All guest features
- ✅ Order products/services
- ✅ Apply for jobs
- ✅ Create organizations
- ✅ Access messaging
- ✅ View personalized dashboard

### Organization Admin/Creator
- ✅ All authenticated user features
- ✅ Manage organization settings
- ✅ Post products/services
- ✅ Post job vacancies
- ✅ Manage members/workers
- ✅ Assign tasks
- ✅ View analytics

### Organization Worker
- ✅ All authenticated user features
- ✅ View assigned tasks
- ✅ Update task status
- ✅ Limited organization access

---

## Level 1 Navigation (5 Bottom Icons)

### 1. 🏠 **Home/Discover**
**Icon**: `home-outline` / `home`
**Purpose**: Main discovery feed
**Access**: Everyone (Guest + Authenticated)

**Shows**:
- Featured local businesses
- Trending products/services
- Recent job postings
- Community highlights
- Location-based recommendations

### 2. 🛒 **Marketplace**
**Icon**: `storefront-outline` / `storefront`
**Purpose**: Browse products and services
**Access**: Everyone (Guest + Authenticated)

**Shows**:
- Products for sale
- Services offered
- Items for rent
- Categories and filters

### 3. 💼 **Opportunities**
**Icon**: `briefcase-outline` / `briefcase`
**Purpose**: Jobs and business opportunities
**Access**: Everyone (Guest + Authenticated)

**Shows**:
- Open job vacancies
- Business partnerships
- Volunteer opportunities
- Internships

### 4. 🏢 **My Space** *(requires login)*
**Icon**: `business-outline` / `business`
**Purpose**: User's organizations and activities
**Access**: Authenticated Only

**Shows**:
- My organizations
- My orders
- My applications
- My tasks
- Add organization button

### 5. 👤 **Account**
**Icon**: `person-outline` / `person`
**Purpose**: User profile and settings
**Access**: Everyone

**Shows (Guest)**:
- Login button
- Register button
- App information

**Shows (Authenticated)**:
- Profile information
- Settings
- Notifications
- Help & Support
- Logout

---

## Level 2 Navigation (Per Level 1 Tab)

### 1. 🏠 **Home** → Level 2 Options

```
┌─────────────────────────────────────┐
│  [Back]  [Near Me]  [New]  [Top]  [All]  │
└─────────────────────────────────────┘
```

1. **🔙 Back** - Return to Level 1
2. **📍 Near Me** - Location-based businesses
3. **✨ New** - Recently added businesses/items
4. **⭐ Top Rated** - Highest rated businesses
5. **🌐 All** - Show everything

---

### 2. 🛒 **Marketplace** → Level 2 Options

```
┌─────────────────────────────────────┐
│  [Back]  [Products]  [Services]  [Rentals]  [Categories]  │
└─────────────────────────────────────┘
```

1. **🔙 Back** - Return to Level 1
2. **📦 Products** - Items for sale
3. **🔧 Services** - Services offered
4. **🏠 Rentals** - Items for rent (houses, equipment, etc.)
5. **📑 Categories** - Browse by category

**Guest Actions**:
- View items ✅
- View details ✅
- Contact seller → Prompts login ❌

**Authenticated Actions**:
- View items ✅
- Add to cart ✅
- Purchase/Order ✅
- Message seller ✅
- Save favorites ✅

---

### 3. 💼 **Opportunities** → Level 2 Options

```
┌─────────────────────────────────────┐
│  [Back]  [Jobs]  [Applied]  [Saved]  [Post]  │
└─────────────────────────────────────┘
```

1. **🔙 Back** - Return to Level 1
2. **💼 Jobs** - Browse all vacancies
3. **📋 Applied** - My applications *(login required)*
4. **⭐ Saved** - Saved job listings *(login required)*
5. **➕ Post Job** - Post a vacancy *(admin only)*

**Guest Actions**:
- Browse jobs ✅
- View details ✅
- Apply → Prompts login ❌

**Authenticated Actions**:
- Browse jobs ✅
- Apply for jobs ✅
- Save jobs ✅
- Track applications ✅

**Admin Actions**:
- Post new job ✅
- Manage posted jobs ✅
- View applicants ✅

---

### 4. 🏢 **My Space** → Level 2 Options *(Login Required)*

```
┌─────────────────────────────────────┐
│  [Back]  [Orgs]  [Orders]  [Tasks]  [Add Org]  │
└─────────────────────────────────────┘
```

1. **🔙 Back** - Return to Level 1
2. **🏢 Organizations** - My organizations list
3. **🛍️ Orders** - My purchase orders
4. **✅ Tasks** - Tasks assigned to me
5. **➕ Add Organization** - Create new organization

**Shows for Guests**:
- Redirect to login screen

**Regular User**:
- View my organizations ✅
- View my orders ✅
- View assigned tasks ✅
- Create new organization ✅

**Admin (per organization)**:
- Manage organization ✅
- Manage members ✅
- Assign tasks ✅
- Post products/services/jobs ✅
- View analytics ✅

---

### 5. 👤 **Account** → Level 2 Options

#### For Guests:
```
┌─────────────────────────────────────┐
│  [Back]  [Login]  [Register]  [About]  [Help]  │
└─────────────────────────────────────┘
```

1. **🔙 Back** - Return to Level 1
2. **🔐 Login** - Login page
3. **📝 Register** - Registration page
4. **ℹ️ About** - About V4L
5. **❓ Help** - Help & Support

#### For Authenticated Users:
```
┌─────────────────────────────────────┐
│  [Back]  [Profile]  [Settings]  [Notifications]  [Logout]  │
└─────────────────────────────────────┘
```

1. **🔙 Back** - Return to Level 1
2. **👤 Profile** - Edit profile
3. **⚙️ Settings** - App settings
4. **🔔 Notifications** - Notification center
5. **🚪 Logout** - Sign out

---

## Navigation States

### State Management
```javascript
navigationState = {
  currentLevel: 1 | 2,
  activeTab: 'home' | 'marketplace' | 'opportunities' | 'myspace' | 'account',
  activeSubTab: null | string,
  history: [],
  isAuthenticated: boolean,
  userRole: 'guest' | 'user' | 'admin' | 'worker'
}
```

### Navigation Flow Examples

#### Example 1: Guest browsing products
```
1. Open app → Home (Level 1)
2. Click Marketplace icon → Marketplace (Level 1)
3. Shows Level 2: [Back] [Products] [Services] [Rentals] [Categories]
4. Click Products → Product list
5. Click product → Product details
6. Click "Order" → Redirect to Login
```

#### Example 2: User creating organization
```
1. Login → Home (Level 1)
2. Click My Space → My Space (Level 1)
3. Shows Level 2: [Back] [Orgs] [Orders] [Tasks] [Add Org]
4. Click "Add Org" → Organization creation wizard
5. Fill details → Organization created
6. Now appears in "Orgs" list
```

#### Example 3: Admin posting a job
```
1. Login as admin → Home (Level 1)
2. Click Opportunities → Opportunities (Level 1)
3. Shows Level 2: [Back] [Jobs] [Applied] [Saved] [Post Job]
4. Click "Post Job" → Job posting form
5. Fill details → Job posted
6. Appears in public job listings
```

---

## Organization Detail Navigation

When user clicks on an organization:

### For Guests:
- Organization overview
- Public products/services
- Public job postings
- Contact information
- "Login to order" / "Login to apply" prompts

### For Members:
- All guest features
- Order products/services
- Apply for jobs
- Member-only content

### For Admins:
- All member features
- **Management Panel** with tabs:
  1. Dashboard
  2. Products/Services
  3. Job Postings
  4. Members
  5. Tasks
  6. Analytics
  7. Settings

---

## Key Features

### Dynamic Navigation
- Level 2 options change based on:
  - User authentication status
  - User role in organization
  - Current context

### Visual Indicators
- Active tab highlighted
- Badge counters (notifications, new orders, pending tasks)
- Lock icons for auth-required features

### Smooth Transitions
- Slide animations between levels
- Breadcrumb trail for deep navigation
- Swipe gestures support

### Accessibility
- Clear icon labels
- High contrast for selected states
- Screen reader support

---

## Implementation Priority

### Phase 1: Core Navigation ✅
- [x] Bottom tab bar component
- [ ] Level 1 navigation
- [ ] Guest vs authenticated routing
- [ ] Basic page structure

### Phase 2: Level 2 Navigation
- [ ] Sub-navigation component
- [ ] Context-aware tab switching
- [ ] Animation and transitions
- [ ] State management

### Phase 3: Advanced Features
- [ ] Badge counters
- [ ] Push notifications integration
- [ ] Deep linking support
- [ ] Search and filters

### Phase 4: Organization Management
- [ ] Organization creation wizard
- [ ] Admin dashboard
- [ ] Task management system
- [ ] Member management

---

## Technical Implementation Notes

### Bottom Tab Bar
```html
<ion-tabs>
  <ion-tab-bar slot="bottom">
    <ion-tab-button tab="home">
      <ion-icon name="home-outline"></ion-icon>
      <ion-label>Home</ion-label>
    </ion-tab-button>
    <!-- Other tabs -->
  </ion-tab-bar>
</ion-tabs>
```

### Level 2 Sub-Navigation
```html
<div class="sub-nav-bar">
  <ion-button fill="clear" (click)="goBack()">
    <ion-icon name="arrow-back"></ion-icon>
  </ion-button>
  <ion-segment value="products">
    <ion-segment-button value="products">Products</ion-segment-button>
    <ion-segment-button value="services">Services</ion-segment-button>
    <!-- Other options -->
  </ion-segment>
</div>
```

### Auth Guard
```javascript
// Redirect to login if route requires auth
if (route.requiresAuth && !isAuthenticated) {
  router.navigate('/login', { redirect: currentPath });
}
```

---

## Next Steps

1. Review and approve navigation structure
2. Create navigation component files
3. Implement bottom tab bar
4. Create page templates for each section
5. Add authentication guards
6. Implement role-based access control
