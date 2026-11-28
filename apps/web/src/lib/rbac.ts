export type AppRole =
  | 'customer'
  | 'staff'
  | 'erp_manager'
  | 'sales_crm'
  | 'marketing'
  | 'admin';

export type AdminModule =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'banners'
  | 'reviews'
  | 'coupons'
  | 'orders'
  | 'returns'
  | 'erp_overview'
  | 'erp_raw_materials'
  | 'erp_suppliers'
  | 'erp_boms'
  | 'erp_purchase_orders'
  | 'erp_production'
  | 'erp_stock_ledger'
  | 'erp_b2b_tiers'
  | 'erp_qc'
  | 'erp_job_work'
  | 'erp_wholesale'
  | 'crm_customers'
  | 'crm_leads'
  | 'crm_followups'
  | 'crm_activities'
  | 'wa_inbox'
  | 'wa_templates'
  | 'wa_campaigns'
  | 'wa_autoreplies'
  | 'wa_settings'
  | 'users';

export const PRIMARY_SUPER_ADMIN_EMAIL = 'dawoodhussain504@gmail.com';
export const SUPER_ADMIN_EMAILS = [PRIMARY_SUPER_ADMIN_EMAIL];
export const PROTECTED_OWNER_PHONES: string[] = [];

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

export interface PermissionTabMeta {
  key: AdminModule;
  label: string;
  href: string;
  description: string;
}

export interface PermissionGroupMeta {
  id: 'storefront' | 'erp' | 'crm' | 'whatsapp';
  label: string;
  description: string;
  items: PermissionTabMeta[];
}

export const PERMISSION_GROUPS: PermissionGroupMeta[] = [
  {
    id: 'storefront',
    label: 'Core Storefront & Orders',
    description: 'Overview, catalog items, coupons, customer reviews, orders & exchanges',
    items: [
      { key: 'dashboard', label: 'Dashboard', href: '/admin', description: 'Main analytics overview' },
      { key: 'products', label: 'Products', href: '/admin/products', description: 'Create, edit & price catalog SKUs' },
      { key: 'categories', label: 'Categories', href: '/admin/categories', description: 'Manage product categories' },
      { key: 'banners', label: 'Banners', href: '/admin/banners', description: 'Hero slides & promotional media' },
      { key: 'reviews', label: 'Customer Reviews', href: '/admin/reviews', description: 'Approve, feature or remove reviews' },
      { key: 'coupons', label: 'Coupons', href: '/admin/coupons', description: 'Promo codes & checkout discounts' },
      { key: 'orders', label: 'Orders & Shipments', href: '/admin/orders', description: 'Process orders, AWB & invoices' },
      { key: 'returns', label: 'Returns & Exchanges', href: '/admin/returns', description: 'Handle 7-day exchange tickets' },
    ],
  },
  {
    id: 'erp',
    label: 'ERP & Manufacturing',
    description: 'Factory floor inventory, raw materials, suppliers, BOMs & B2B tiers',
    items: [
      { key: 'erp_overview', label: 'ERP Overview', href: '/admin/erp', description: 'Manufacturing KPIs & capacity' },
      { key: 'erp_raw_materials', label: 'Raw Materials', href: '/admin/erp/raw-materials', description: 'Fabric rolls, trims & stock levels' },
      { key: 'erp_suppliers', label: 'Suppliers', href: '/admin/erp/suppliers', description: 'Mill & vendor directory' },
      { key: 'erp_boms', label: 'Bill of Materials', href: '/admin/erp/boms', description: 'Product-to-material recipes' },
      { key: 'erp_purchase_orders', label: 'Purchase Orders', href: '/admin/erp/purchase-orders', description: 'Procurement & GRN receiving' },
      { key: 'erp_production', label: 'Production Runs', href: '/admin/erp/production', description: 'Batch cutting, wash & QC runs' },
      { key: 'erp_stock_ledger', label: 'Stock Ledger', href: '/admin/erp/stock-ledger', description: 'Material inward/outward audit' },
      { key: 'erp_b2b_tiers', label: 'B2B Price Tiers', href: '/admin/erp/b2b-tiers', description: 'Wholesale MOQ slab pricing' },
      { key: 'erp_qc', label: 'QC & Defect Lab', href: '/admin/erp/qc', description: 'Fabric roll & stage defect inspections' },
      { key: 'erp_job_work', label: 'Karigar & Job Work', href: '/admin/erp/job-work', description: 'Outwork challans & karigar piece-rate wages' },
      { key: 'erp_wholesale', label: 'B2B Quotes & Khata', href: '/admin/erp/wholesale', description: 'Wholesale proforma quotes & buyer credit ledger' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM & B2B Pipeline',
    description: 'Customer directory, wholesale leads, follow-ups & activity logs',
    items: [
      { key: 'crm_customers', label: 'Customer Directory', href: '/admin/crm/customers', description: 'Buyer profiles & tiers' },
      { key: 'crm_leads', label: 'B2B Leads Pipeline', href: '/admin/crm/leads', description: 'Wholesale inquiries & deal stages' },
      { key: 'crm_followups', label: 'Scheduled Follow-ups', href: '/admin/crm/followups', description: 'Call & WhatsApp task reminders' },
      { key: 'crm_activities', label: 'Activity Audit Feed', href: '/admin/crm/activities', description: 'Sales interaction timeline' },
    ],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp & Engagement',
    description: 'Two-way WhatsApp inbox, message templates, broadcasts, bot & settings',
    items: [
      { key: 'wa_inbox', label: 'Live Inbox & Bridge', href: '/admin/whatsapp', description: 'Two-way chat & connection status' },
      { key: 'wa_templates', label: 'Message Templates', href: '/admin/whatsapp/templates', description: 'Reusable spintax/alert templates' },
      { key: 'wa_campaigns', label: 'Broadcast Campaigns', href: '/admin/whatsapp/campaigns', description: 'Segment outreach campaigns' },
      { key: 'wa_autoreplies', label: 'Auto-Reply Bot', href: '/admin/whatsapp/auto-replies', description: 'Keyword/regex auto-responders' },
      { key: 'wa_settings', label: 'Anti-Ban Engine & Pairing', href: '/admin/whatsapp/settings', description: 'Rate limits, warmup & bridge pairing' },
    ],
  },
];

export const ALL_GRANULAR_PERMISSIONS: AdminModule[] = PERMISSION_GROUPS.flatMap(
  (g) => g.items.map((item) => item.key)
);

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
    label: 'Admin',
    shortLabel: 'Admin',
    description: 'Full operational access across Storefront, ERP, CRM & WhatsApp (Only Super Admin manages Users/Roles).',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    modules: [...ALL_GRANULAR_PERMISSIONS],
  },
  erp_manager: {
    label: 'ERP & Factory Manager',
    shortLabel: 'ERP Mgr',
    description: 'Manages Raw Materials, Suppliers, BOMs, Purchase Orders, Production Runs & Catalog SKUs.',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    modules: [
      'dashboard',
      'products',
      'categories',
      'erp_overview',
      'erp_raw_materials',
      'erp_suppliers',
      'erp_boms',
      'erp_purchase_orders',
      'erp_production',
      'erp_stock_ledger',
      'erp_b2b_tiers',
      'erp_qc',
      'erp_job_work',
    ],
  },
  sales_crm: {
    label: 'Sales, Orders & CRM',
    shortLabel: 'Sales/CRM',
    description: 'Handles Orders, Shipments, Returns, CRM Customers, B2B Leads & WhatsApp Live Inbox.',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    modules: [
      'dashboard',
      'orders',
      'returns',
      'erp_b2b_tiers',
      'erp_wholesale',
      'crm_customers',
      'crm_leads',
      'crm_followups',
      'crm_activities',
      'wa_inbox',
    ],
  },
  marketing: {
    label: 'Catalog & WhatsApp Marketing',
    shortLabel: 'Marketing',
    description: 'Manages Products, Banners, Coupons, Reviews & WhatsApp Broadcasts/Auto-Replies.',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    modules: [
      'dashboard',
      'products',
      'categories',
      'banners',
      'reviews',
      'coupons',
      'wa_inbox',
      'wa_templates',
      'wa_campaigns',
      'wa_autoreplies',
    ],
  },
  staff: {
    label: 'Operations Staff',
    shortLabel: 'Staff',
    description: 'Day-to-day Order processing, Returns, Customer Directory & WhatsApp Inbox.',
    badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
    modules: [
      'dashboard',
      'orders',
      'returns',
      'crm_customers',
      'crm_followups',
      'wa_inbox',
    ],
  },
  customer: {
    label: 'Customer',
    shortLabel: 'Customer',
    description: 'Standard storefront buyer account with no Admin ERP access.',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    modules: [],
  },
};

export interface UserAuthLike {
  email?: string | null;
  app_metadata?: Record<string, any> | null;
  user_metadata?: Record<string, any> | null;
}

export function normalizeRoleValue(raw?: string | null): AppRole {
  const val = String(raw || '').trim().toLowerCase() as AppRole;
  if (ALL_ROLES.includes(val)) return val;
  return 'customer';
}

export function isPrimarySuperAdmin(user?: { email?: string | null } | null): boolean {
  if (!user?.email) return false;
  return user.email.trim().toLowerCase() === PRIMARY_SUPER_ADMIN_EMAIL;
}

export function resolveUserRole(user?: UserAuthLike | null): AppRole {
  if (!user) return 'customer';
  if (isPrimarySuperAdmin(user)) return 'admin';
  return normalizeRoleValue(user.app_metadata?.role || user.user_metadata?.role);
}

export function isTeamRole(role: AppRole): boolean {
  return TEAM_ROLES.includes(role);
}

export function sanitizePermissionList(list: unknown): AdminModule[] | null {
  if (!Array.isArray(list)) return null;
  const validSet = new Set<AdminModule>(ALL_GRANULAR_PERMISSIONS);
  const cleaned: AdminModule[] = [];
  for (const item of list) {
    const key = String(item || '').trim() as AdminModule;
    if (validSet.has(key) && !cleaned.includes(key)) {
      cleaned.push(key);
    }
  }
  return cleaned;
}

export function getRoleDefaultPermissions(role: AppRole): AdminModule[] {
  return [...(ROLE_META[role]?.modules || [])];
}

export function resolveUserPermissions(
  user?: UserAuthLike | null,
  explicitCustomPermissions?: unknown
): AdminModule[] {
  if (!user) return [];
  if (isPrimarySuperAdmin(user)) {
    return [...ALL_GRANULAR_PERMISSIONS, 'users'];
  }
  const role = resolveUserRole(user);
  if (!isTeamRole(role)) return [];

  const rawCustom =
    explicitCustomPermissions !== undefined
      ? explicitCustomPermissions
      : user.app_metadata?.permissions;

  const custom = sanitizePermissionList(rawCustom);
  if (custom !== null) {
    return custom;
  }
  return getRoleDefaultPermissions(role);
}

export function hasCustomPermissionOverride(
  role: AppRole,
  permissions: AdminModule[]
): boolean {
  const defaults = getRoleDefaultPermissions(role);
  if (defaults.length !== permissions.length) return true;
  const defSet = new Set(defaults);
  return permissions.some((p) => !defSet.has(p));
}

export function hasUserPermission(
  user: UserAuthLike | null | undefined,
  required: AdminModule | AdminModule[],
  explicitCustomPermissions?: unknown
): boolean {
  if (!user) return false;
  if (isPrimarySuperAdmin(user)) return true;

  const requiredList = Array.isArray(required) ? required : [required];
  if (requiredList.includes('users') && requiredList.length === 1) {
    return false;
  }

  const perms = resolveUserPermissions(user, explicitCustomPermissions);
  return requiredList.some((r) => perms.includes(r));
}

export function hasModuleAccess(role: AppRole, mod: AdminModule): boolean {
  return ROLE_META[role]?.modules.includes(mod) ?? false;
}

export function requiredModuleForAdminPath(pathname: string): AdminModule {
  if (pathname.startsWith('/admin/users')) return 'users';
  if (pathname.startsWith('/admin/products')) return 'products';
  if (pathname.startsWith('/admin/categories')) return 'categories';
  if (pathname.startsWith('/admin/banners')) return 'banners';
  if (pathname.startsWith('/admin/reviews')) return 'reviews';
  if (pathname.startsWith('/admin/coupons')) return 'coupons';
  if (pathname.startsWith('/admin/orders')) return 'orders';
  if (pathname.startsWith('/admin/returns')) return 'returns';

  if (pathname.startsWith('/admin/erp/raw-materials')) return 'erp_raw_materials';
  if (pathname.startsWith('/admin/erp/suppliers')) return 'erp_suppliers';
  if (pathname.startsWith('/admin/erp/boms')) return 'erp_boms';
  if (pathname.startsWith('/admin/erp/purchase-orders')) return 'erp_purchase_orders';
  if (pathname.startsWith('/admin/erp/production')) return 'erp_production';
  if (pathname.startsWith('/admin/erp/stock-ledger')) return 'erp_stock_ledger';
  if (pathname.startsWith('/admin/erp/b2b-tiers')) return 'erp_b2b_tiers';
  if (pathname.startsWith('/admin/erp/qc')) return 'erp_qc';
  if (pathname.startsWith('/admin/erp/job-work')) return 'erp_job_work';
  if (pathname.startsWith('/admin/erp/wholesale')) return 'erp_wholesale';
  if (pathname.startsWith('/admin/erp')) return 'erp_overview';

  if (pathname.startsWith('/admin/crm/customers')) return 'crm_customers';
  if (pathname.startsWith('/admin/crm/leads')) return 'crm_leads';
  if (pathname.startsWith('/admin/crm/followups')) return 'crm_followups';
  if (pathname.startsWith('/admin/crm/activities')) return 'crm_activities';
  if (pathname.startsWith('/admin/crm')) return 'crm_customers';

  if (pathname.startsWith('/admin/whatsapp/templates')) return 'wa_templates';
  if (pathname.startsWith('/admin/whatsapp/campaigns')) return 'wa_campaigns';
  if (pathname.startsWith('/admin/whatsapp/auto-replies')) return 'wa_autoreplies';
  if (pathname.startsWith('/admin/whatsapp/settings')) return 'wa_settings';
  if (pathname.startsWith('/admin/whatsapp')) return 'wa_inbox';

  return 'dashboard';
}

export function getFirstAllowedAdminPath(
  user?: UserAuthLike | null,
  explicitCustomPermissions?: unknown
): string | null {
  if (!user) return null;
  if (isPrimarySuperAdmin(user)) return '/admin';
  const perms = resolveUserPermissions(user, explicitCustomPermissions);
  for (const group of PERMISSION_GROUPS) {
    for (const item of group.items) {
      if (perms.includes(item.key)) {
        return item.href;
      }
    }
  }
  return null;
}

export function canUserAccessAdminPath(
  user: UserAuthLike | null | undefined,
  pathname: string,
  explicitCustomPermissions?: unknown
): boolean {
  if (!user) return false;
  if (isPrimarySuperAdmin(user)) return true;
  if (!isTeamRole(resolveUserRole(user))) return false;
  const required = requiredModuleForAdminPath(pathname);
  return hasUserPermission(user, required, explicitCustomPermissions);
}

export function canRoleAccessPath(
  role: AppRole,
  pathname: string,
  user?: UserAuthLike | null
): boolean {
  if (user) return canUserAccessAdminPath(user, pathname);
  if (!isTeamRole(role)) return false;
  const required = requiredModuleForAdminPath(pathname);
  if (required === 'users') return false;
  return hasModuleAccess(role, required);
}

export function isProtectedOwner(email?: string | null, _phone?: string | null): boolean {
  const cleanEmail = (email || '').trim().toLowerCase();
  return cleanEmail === PRIMARY_SUPER_ADMIN_EMAIL;
}
