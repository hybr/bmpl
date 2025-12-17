# Quick Start Guide

This guide will help you get started with the multi-organization management app.

## Prerequisites

- Node.js 18+ and npm/yarn
- Android Studio (for Android development)
- Xcode (for iOS development, Mac only)
- Git

## Step 1: Create Capacitor Project

Choose your preferred framework:

### Option A: React + TypeScript (Recommended)

```bash
npm create vite@latest bmpa-app -- --template react-ts
cd bmpa-app
npm install

# Add Ionic and Capacitor
npm install @ionic/react @ionic/react-router ionic-react
npm install @capacitor/core @capacitor/cli
npx cap init
```

### Option B: Vue + TypeScript

```bash
npm create vite@latest bmpa-app -- --template vue-ts
cd bmpa-app
npm install

# Add Ionic and Capacitor
npm install @ionic/vue @ionic/vue-router
npm install @capacitor/core @capacitor/cli
npx cap init
```

## Step 2: Install Core Dependencies

```bash
# State Management
npm install zustand

# Routing
npm install react-router-dom  # or vue-router for Vue

# API Client
npm install axios

# Form Management & Validation
npm install react-hook-form zod @hookform/resolvers  # for React
# or
npm install vee-validate yup  # for Vue

# Capacitor Plugins
npm install @capacitor/storage @capacitor/preferences @capacitor/network
npm install @capacitor/push-notifications @capacitor/haptics

# Optional: Biometric Auth
npm install @capacitor-community/biometric

# UI Framework
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## Step 3: Configure Capacitor

Run the init command and follow prompts:

```bash
npx cap init
# Enter app name: "BMPA"
# Enter app ID: "com.yourcompany.bmpa"
```

Add platforms:

```bash
npx cap add android
npx cap add ios  # Mac only
```

## Step 4: Project Structure

Create the recommended folder structure:

```bash
mkdir -p src/{api,components/{common,auth,organization},pages,stores,services,hooks,types,utils,navigation,assets/{images,icons}}
```

## Step 5: Core Configuration Files

### Environment Variables

Create `.env.development` and `.env.production`:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=BMPA
VITE_ENABLE_BIOMETRIC=true
```

### TypeScript Config

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Step 6: Core Implementation Examples

### API Client (`src/api/client.ts`)

```typescript
import axios from 'axios';
import { storageService } from '../services/storageService';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storageService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await storageService.getRefreshToken();
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refreshToken }
        );

        await storageService.setAccessToken(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        await storageService.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### Storage Service (`src/services/storageService.ts`)

```typescript
import { Storage } from '@capacitor/storage';

class StorageService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user';
  private readonly ACTIVE_ORG_KEY = 'active_organization';

  async setAccessToken(token: string): Promise<void> {
    await Storage.set({ key: this.ACCESS_TOKEN_KEY, value: token });
  }

  async getAccessToken(): Promise<string | null> {
    const { value } = await Storage.get({ key: this.ACCESS_TOKEN_KEY });
    return value;
  }

  async setRefreshToken(token: string): Promise<void> {
    await Storage.set({ key: this.REFRESH_TOKEN_KEY, value: token });
  }

  async getRefreshToken(): Promise<string | null> {
    const { value } = await Storage.get({ key: this.REFRESH_TOKEN_KEY });
    return value;
  }

  async setUser(user: any): Promise<void> {
    await Storage.set({ key: this.USER_KEY, value: JSON.stringify(user) });
  }

  async getUser(): Promise<any | null> {
    const { value } = await Storage.get({ key: this.USER_KEY });
    return value ? JSON.parse(value) : null;
  }

  async setActiveOrganization(orgId: string): Promise<void> {
    await Storage.set({ key: this.ACTIVE_ORG_KEY, value: orgId });
  }

  async getActiveOrganization(): Promise<string | null> {
    const { value } = await Storage.get({ key: this.ACTIVE_ORG_KEY });
    return value;
  }

  async clearTokens(): Promise<void> {
    await Storage.remove({ key: this.ACCESS_TOKEN_KEY });
    await Storage.remove({ key: this.REFRESH_TOKEN_KEY });
    await Storage.remove({ key: this.USER_KEY });
  }

  async clearAll(): Promise<void> {
    await Storage.clear();
  }
}

export const storageService = new StorageService();
```

### Auth Store (Zustand) (`src/stores/authStore.ts`)

```typescript
import { create } from 'zustand';
import { authApi } from '../api/auth.api';
import { storageService } from '../services/storageService';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authApi.login({ email, password });

      await storageService.setAccessToken(data.accessToken);
      await storageService.setRefreshToken(data.refreshToken);
      await storageService.setUser(data.user);

      set({
        user: data.user,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Login failed',
        loading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await storageService.clearAll();
      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  loadStoredSession: async () => {
    set({ loading: true });
    try {
      const user = await storageService.getUser();
      const token = await storageService.getAccessToken();

      if (user && token) {
        set({
          user,
          isAuthenticated: true,
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Session load error:', error);
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
```

### Organization Store (`src/stores/organizationStore.ts`)

```typescript
import { create } from 'zustand';
import { organizationApi } from '../api/organizations.api';
import { storageService } from '../services/storageService';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  createdAt: string;
}

interface OrganizationState {
  organizations: Organization[];
  activeOrganization: Organization | null;
  loading: boolean;
  error: string | null;

  fetchOrganizations: () => Promise<void>;
  setActiveOrganization: (orgId: string) => Promise<void>;
  createOrganization: (data: Partial<Organization>) => Promise<void>;
  updateOrganization: (orgId: string, data: Partial<Organization>) => Promise<void>;
  deleteOrganization: (orgId: string) => Promise<void>;
}

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
  organizations: [],
  activeOrganization: null,
  loading: false,
  error: null,

  fetchOrganizations: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await organizationApi.getAll();
      set({ organizations: data, loading: false });

      // Load active organization from storage
      const activeOrgId = await storageService.getActiveOrganization();
      if (activeOrgId) {
        const activeOrg = data.find((org: Organization) => org.id === activeOrgId);
        if (activeOrg) {
          set({ activeOrganization: activeOrg });
        }
      } else if (data.length > 0) {
        // Set first org as active if none selected
        set({ activeOrganization: data[0] });
        await storageService.setActiveOrganization(data[0].id);
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch organizations',
        loading: false,
      });
    }
  },

  setActiveOrganization: async (orgId: string) => {
    const org = get().organizations.find((o) => o.id === orgId);
    if (org) {
      set({ activeOrganization: org });
      await storageService.setActiveOrganization(orgId);
    }
  },

  createOrganization: async (data) => {
    set({ loading: true, error: null });
    try {
      const { data: newOrg } = await organizationApi.create(data);
      set((state) => ({
        organizations: [...state.organizations, newOrg],
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create organization',
        loading: false,
      });
      throw error;
    }
  },

  updateOrganization: async (orgId, data) => {
    set({ loading: true, error: null });
    try {
      const { data: updatedOrg } = await organizationApi.update(orgId, data);
      set((state) => ({
        organizations: state.organizations.map((org) =>
          org.id === orgId ? updatedOrg : org
        ),
        activeOrganization:
          state.activeOrganization?.id === orgId
            ? updatedOrg
            : state.activeOrganization,
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update organization',
        loading: false,
      });
      throw error;
    }
  },

  deleteOrganization: async (orgId) => {
    set({ loading: true, error: null });
    try {
      await organizationApi.delete(orgId);
      set((state) => {
        const newOrgs = state.organizations.filter((org) => org.id !== orgId);
        const newActiveOrg =
          state.activeOrganization?.id === orgId
            ? newOrgs[0] || null
            : state.activeOrganization;

        if (newActiveOrg) {
          storageService.setActiveOrganization(newActiveOrg.id);
        }

        return {
          organizations: newOrgs,
          activeOrganization: newActiveOrg,
          loading: false,
        };
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete organization',
        loading: false,
      });
      throw error;
    }
  },
}));
```

### Protected Route Component (`src/navigation/ProtectedRoute.tsx`)

```typescript
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return <div>Loading...</div>; // Replace with proper loading component
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

## Step 7: Run Development Server

```bash
# Web development
npm run dev

# Sync changes to native projects
npx cap sync

# Run on Android
npx cap open android
# Then run from Android Studio

# Run on iOS (Mac only)
npx cap open ios
# Then run from Xcode
```

## Step 8: Live Reload for Native Development

Add to `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.bmpa',
  appName: 'BMPA',
  webDir: 'dist',
  server: {
    // Enable for live reload during development
    // Replace with your local IP
    url: 'http://192.168.1.100:5173',
    cleartext: true,
  },
};

export default config;
```

## Useful Commands

```bash
# Build web version
npm run build

# Sync native projects
npx cap sync

# Update Capacitor and plugins
npx cap update

# Copy web assets to native projects
npx cap copy

# Run Android
npx cap run android

# Run iOS
npx cap run ios

# Add platform
npx cap add [android|ios]

# Remove platform
npx cap remove [android|ios]
```

## Next Steps

1. Review the `ARCHITECTURE_PLAN.md` for detailed architecture
2. Follow `IMPLEMENTATION_CHECKLIST.md` for step-by-step development
3. Start with authentication implementation
4. Build organization management features
5. Add native capabilities
6. Test thoroughly on all platforms
7. Deploy to app stores

## Troubleshooting

### Android Build Issues
- Ensure Android Studio and SDK are properly installed
- Check Gradle version compatibility
- Verify signing keys are configured

### iOS Build Issues
- Ensure Xcode is installed (Mac only)
- Check provisioning profiles
- Verify bundle identifier matches

### Storage Issues
- Clear app data if testing auth flow
- Check Storage plugin is properly initialized

### Network Issues
- Verify API URL in environment variables
- Check CORS settings on backend
- Test with mock API first

## Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Ionic React Docs](https://ionicframework.com/docs/react)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [React Router Docs](https://reactrouter.com/)
- [Axios Docs](https://axios-http.com/)
