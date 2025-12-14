# TypeScript Type Definitions

Complete type definitions for the multi-organization management app.

## Core Types

### User Types (`src/types/user.ts`)

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  phone?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  notificationPreferences: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  organizationUpdates: boolean;
  memberActivity: boolean;
}

export interface UpdateUserDto {
  name?: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  timezone?: string;
  language?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
```

### Organization Types (`src/types/organization.ts`)

```typescript
export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: OrganizationSize;
  role: OrganizationRole;
  createdAt: string;
  updatedAt: string;
  settings?: OrganizationSettings;
  stats?: OrganizationStats;
}

export type OrganizationSize = 'small' | 'medium' | 'large' | 'enterprise';

export interface OrganizationSettings {
  notifications: boolean;
  theme?: 'light' | 'dark' | 'auto';
  timezone?: string;
  language?: string;
  visibility: 'public' | 'private';
  allowMemberInvites: boolean;
  requireApproval: boolean;
}

export interface OrganizationStats {
  memberCount: number;
  activeMembers: number;
  projectCount?: number;
  storageUsed?: number;
  storageLimit?: number;
}

export interface CreateOrganizationDto {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: OrganizationSize;
}

export interface UpdateOrganizationDto {
  name?: string;
  description?: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: OrganizationSize;
  settings?: Partial<OrganizationSettings>;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  user: User;
  joinedAt: string;
  invitedBy?: string;
}

export interface InviteMemberDto {
  email: string;
  role: OrganizationRole;
  message?: string;
}

export interface UpdateMemberRoleDto {
  role: OrganizationRole;
}

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  organization: Organization;
  email: string;
  role: OrganizationRole;
  invitedBy: string;
  inviter: User;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expiresAt: string;
  createdAt: string;
}
```

### Authentication Types (`src/types/auth.ts`)

```typescript
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  acceptTerms: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterResponse {
  user: User;
  message: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface BiometricCredentials {
  email: string;
  encryptedPassword: string;
}
```

### API Types (`src/types/api.ts`)

```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: Record<string, any>;
}

export interface ApiRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
}
```

### Activity Types (`src/types/activity.ts`)

```typescript
export type ActivityType =
  | 'organization.created'
  | 'organization.updated'
  | 'organization.deleted'
  | 'member.joined'
  | 'member.left'
  | 'member.invited'
  | 'member.role_changed'
  | 'settings.updated'
  | 'user.login'
  | 'user.logout';

export interface Activity {
  id: string;
  type: ActivityType;
  organizationId?: string;
  userId: string;
  user: User;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface OrganizationActivity extends Activity {
  organizationId: string;
  organization: Organization;
}
```

### Notification Types (`src/types/notification.ts`)

```typescript
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  userId: string;
  organizationId?: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  email: boolean;
  push: boolean;
  types: {
    organizationUpdates: boolean;
    memberActivity: boolean;
    invitations: boolean;
    mentions: boolean;
  };
}
```

### App State Types (`src/types/app.ts`)

```typescript
export type Theme = 'light' | 'dark' | 'auto';

export type Language = 'en' | 'es' | 'fr' | 'de' | 'pt';

export interface AppSettings {
  theme: Theme;
  language: Language;
  notifications: boolean;
  autoSync: boolean;
  offlineMode: boolean;
}

export interface NetworkStatus {
  connected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
  effectiveType?: '2g' | '3g' | '4g' | '5g';
}

export interface SyncStatus {
  syncing: boolean;
  lastSyncAt?: string;
  pendingChanges: number;
  failedSync: boolean;
}

export interface AppState {
  isOnline: boolean;
  networkStatus: NetworkStatus;
  syncStatus: SyncStatus;
  settings: AppSettings;
}
```

### Storage Types (`src/types/storage.ts`)

```typescript
export interface StorageKeys {
  ACCESS_TOKEN: string;
  REFRESH_TOKEN: string;
  USER: string;
  ACTIVE_ORGANIZATION: string;
  ORGANIZATIONS: string;
  SETTINGS: string;
  BIOMETRIC_ENABLED: string;
  BIOMETRIC_CREDENTIALS: string;
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface StorageService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}
```

### Form Types (`src/types/form.ts`)

```typescript
export interface FormFieldError {
  type: string;
  message: string;
}

export interface FormErrors {
  [field: string]: FormFieldError;
}

export interface FormState<T> {
  values: T;
  errors: FormErrors;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule;
};
```

### Route Types (`src/types/routes.ts`)

```typescript
export interface RouteConfig {
  path: string;
  component: React.ComponentType<any>;
  exact?: boolean;
  protected?: boolean;
  roles?: OrganizationRole[];
  title?: string;
  icon?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  badge?: number | string;
  disabled?: boolean;
  children?: NavigationItem[];
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}
```

### Component Props Types (`src/types/components.ts`)

```typescript
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  testId?: string;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
}

export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  name: string;
  label?: string;
  placeholder?: string;
  value: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  children: React.ReactNode;
}

export interface ToastProps {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

## Utility Types

### Helper Types (`src/types/helpers.ts`)

```typescript
// Make all properties optional recursively
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Make specific properties required
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// Pick properties by value type
export type PickByValue<T, ValueType> = Pick<
  T,
  { [Key in keyof T]-?: T[Key] extends ValueType ? Key : never }[keyof T]
>;

// Exclude properties by value type
export type OmitByValue<T, ValueType> = Pick<
  T,
  { [Key in keyof T]-?: T[Key] extends ValueType ? never : Key }[keyof T]
>;

// Create a type from an array of strings
export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

// Function type helper
export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;

// Extract promise type
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
```

## Type Guards

### Type Guard Functions (`src/types/guards.ts`)

```typescript
export function isUser(value: any): value is User {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    typeof value.name === 'string'
  );
}

export function isOrganization(value: any): value is Organization {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.slug === 'string' &&
    typeof value.role === 'string'
  );
}

export function isApiError(value: any): value is ApiError {
  return (
    value &&
    typeof value === 'object' &&
    value.success === false &&
    value.error &&
    typeof value.error === 'object'
  );
}

export function isOrganizationRole(value: any): value is OrganizationRole {
  return ['owner', 'admin', 'member', 'viewer'].includes(value);
}

export function hasPermission(
  role: OrganizationRole,
  requiredRole: OrganizationRole
): boolean {
  const roleHierarchy: Record<OrganizationRole, number> = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
  };

  return roleHierarchy[role] >= roleHierarchy[requiredRole];
}
```

## Constants

### Type Constants (`src/types/constants.ts`)

```typescript
export const ORGANIZATION_ROLES = ['owner', 'admin', 'member', 'viewer'] as const;

export const ACTIVITY_TYPES = [
  'organization.created',
  'organization.updated',
  'organization.deleted',
  'member.joined',
  'member.left',
  'member.invited',
  'member.role_changed',
  'settings.updated',
  'user.login',
  'user.logout',
] as const;

export const NOTIFICATION_TYPES = ['info', 'success', 'warning', 'error'] as const;

export const THEMES = ['light', 'dark', 'auto'] as const;

export const LANGUAGES = ['en', 'es', 'fr', 'de', 'pt'] as const;

export const ORGANIZATION_SIZES = ['small', 'medium', 'large', 'enterprise'] as const;

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  ACTIVE_ORGANIZATION: 'active_organization',
  ORGANIZATIONS: 'organizations',
  SETTINGS: 'settings',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  BIOMETRIC_CREDENTIALS: 'biometric_credentials',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',

  // User
  ME: '/users/me',
  UPDATE_PROFILE: '/users/me',
  CHANGE_PASSWORD: '/users/me/password',

  // Organizations
  ORGANIZATIONS: '/organizations',
  ORGANIZATION: (id: string) => `/organizations/${id}`,
  ORGANIZATION_MEMBERS: (id: string) => `/organizations/${id}/members`,
  ORGANIZATION_MEMBER: (orgId: string, memberId: string) =>
    `/organizations/${orgId}/members/${memberId}`,

  // Notifications
  NOTIFICATIONS: '/notifications',
  NOTIFICATION: (id: string) => `/notifications/${id}`,
  MARK_READ: (id: string) => `/notifications/${id}/read`,
} as const;
```

## Usage Examples

### Using Types in Components

```typescript
import { Organization, OrganizationRole } from '../types/organization';
import { User } from '../types/user';

interface OrganizationCardProps {
  organization: Organization;
  onSelect: (org: Organization) => void;
}

export const OrganizationCard: React.FC<OrganizationCardProps> = ({
  organization,
  onSelect,
}) => {
  return (
    <div onClick={() => onSelect(organization)}>
      <h3>{organization.name}</h3>
      <span>{organization.role}</span>
    </div>
  );
};
```

### Using Type Guards

```typescript
import { isApiError, hasPermission } from '../types/guards';

try {
  const response = await api.getOrganization(id);
  // response is typed as Organization
} catch (error) {
  if (isApiError(error)) {
    console.error(error.error.message);
  }
}

// Check permissions
if (hasPermission(user.role, 'admin')) {
  // User has admin or owner permissions
  showAdminFeatures();
}
```

### Using with Zustand Stores

```typescript
import { StateCreator } from 'zustand';
import { User } from '../types/user';

interface AuthSlice {
  user: User | null;
  setUser: (user: User) => void;
}

const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
});
```

This comprehensive type system ensures type safety throughout your application and provides excellent IDE autocomplete support.
