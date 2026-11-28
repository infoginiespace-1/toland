export type AppRole =
  | 'customer'
  | 'staff'
  | 'erp_manager'
  | 'sales_crm'
  | 'marketing'
  | 'admin';

export type AdminModule =
  | 'dashboard'
  | 'catalog'
  | 'orders'
  | 'erp'
  | 'crm'
  | 'whatsapp_inbox'
  | 'whatsapp_admin'
  | 'users';

export const SUPER_ADMIN_EMAILS = [
  'info.giniespace@gmail.com',
  'dawoodhussain504@gmail.com',
];

export const PROTECTED_OWNER_PHONES = ['8797186001'];

export const ALL_ROLES: AppRole[] = [
  'admin',
  'erp_manager',
  'sales_crm',
  'marketing',
  'staff',
  'customer',
];

export const TEAM_ROLES: AppRole[] = [
  'admin',
  'erp_manager',
  'sales_crm',
  'marketing',
  'staff',
];

export const ROLE_META: Record<
  AppRole,
  {
    label: string;
    shortLabel: string;
    description: string;
    badgeClass: string;
    modules: AdminModule[];
  }
> = {
  admin: {
    label: 'Super Admin',
    shortLabel: 'Admin',
    description: 'Full access to Storefront, ERP, CRM, WhatsApp Engine, Users & Role Assignment.',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    modules: [
      'dashboard',
      'catalog',
      'orders',
      'erp',
      'crm',
      'whatsapp_inbox',
      'whatsapp_admin',
      'users',
    ],
  },
  erp_manager: {
    label: 'ERP & Factory Manager',
    shortLabel: 'ERP Mgr',
    description: 'Manages Raw Materials, Suppliers, BOMs, Purchase Orders, Production Runs & Stock.',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    modules: ['dashboard', 'erp', 'catalog'],
  },
  sales_crm: {
    label: 'Sales, Orders & CRM',
    shortLabel: 'Sales/CRM',
    description: 'Handles Orders, Shipments, Returns, B2B Leads, Follow-ups & WhatsApp Live Inbox.',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    modules: ['dashboard', 'orders', 'crm', 'whatsapp_inbox'],
  },
  marketing: {
    label: 'Catalog & WhatsApp Marketing',
    shortLabel: 'Marketing',
    description: 'Manages Products, Banners, Coupons, Reviews & WhatsApp Broadcasts/Auto-Replies.',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    modules: ['dashboard', 'catalog', 'whatsapp_inbox', 'whatsapp_admin'],
  },
  staff: {
    label: 'Operations Staff',
    shortLabel: 'Staff',
    description: 'Day-to-day order processing, returns, customer directory & WhatsApp inbox replies.',
    badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
    modules: ['dashboard', 'orders', 'crm', 'whatsapp_inbox'],
  },
  customer: {
    label: 'Customer',
    shortLabel: 'Customer',
    description: 'Standard storefront buyer account with no Admin ERP access.',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    modules: [],
  },
};

export function normalizeRoleValue(raw?: string | null): AppRole {
  const val = String(raw || '').trim().toLowerCase() as AppRole;
  if (ALL_ROLES.includes(val)) return val;
  return 'customer';
}

export function resolveUserRole(
  user?: {
    app_metadata?: Record<string, any> | null;
    user_metadata?: Record<string, any> | null;
    email?: string | null;
  } | null
): AppRole {
  if (!user) return 'customer';
  const email = (user.email || '').toLowerCase();
  if (SUPER_ADMIN_EMAILS.includes(email)) {
    return 'admin';
  }
  return normalizeRoleValue(user.app_metadata?.role || user.user_metadata?.role);
}

export function isTeamRole(role: AppRole): boolean {
  return TEAM_ROLES.includes(role);
}

export function hasModuleAccess(role: AppRole, mod: AdminModule): boolean {
  return ROLE_META[role]?.modules.includes(mod) ?? false;
}

export function requiredModuleForAdminPath(pathname: string): AdminModule {
  if (pathname.startsWith('/admin/users')) return 'users';
  if (pathname.startsWith('/admin/erp')) return 'erp';
  if (pathname.startsWith('/admin/crm')) return 'crm';
  if (pathname.startsWith('/admin/orders') || pathname.startsWith('/admin/returns')) {
    return 'orders';
  }
  if (
    pathname.startsWith('/admin/products') ||
    pathname.startsWith('/admin/categories') ||
    pathname.startsWith('/admin/banners') ||
    pathname.startsWith('/admin/coupons') ||
    pathname.startsWith('/admin/reviews')
  ) {
    return 'catalog';
  }
  if (
    pathname.startsWith('/admin/whatsapp/templates') ||
    pathname.startsWith('/admin/whatsapp/campaigns') ||
    pathname.startsWith('/admin/whatsapp/auto-replies') ||
    pathname.startsWith('/admin/whatsapp/settings')
  ) {
    return 'whatsapp_admin';
  }
  if (pathname.startsWith('/admin/whatsapp')) return 'whatsapp_inbox';
  return 'dashboard';
}

export function canRoleAccessPath(role: AppRole, pathname: string): boolean {
  if (!isTeamRole(role)) return false;
  const required = requiredModuleForAdminPath(pathname);
  return hasModuleAccess(role, required);
}

export function isProtectedOwner(email?: string | null, phone?: string | null): boolean {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (SUPER_ADMIN_EMAILS.includes(cleanEmail)) return true;
  const digits = (phone || '').replace(/\D/g, '').slice(-10);
  return Boolean(digits && PROTECTED_OWNER_PHONES.includes(digits));
}
