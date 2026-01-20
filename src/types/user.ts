export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role_id: string;
  role_name?: string;
  associated_industry?: string;
  associated_vendor?: string;
  associated_brand?: string;
  status: 'active' | 'inactive';
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  role_name: string;
  role_description: string;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  role_id: string;
  module_name: string;
  can_view: boolean;
  can_edit: boolean;
  can_create: boolean;
  can_delete: boolean;
  can_bulk_actions: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  user_name: string;
  action_type: 'create' | 'update' | 'delete' | 'import' | 'export' | 'login' | 'logout';
  module_name: string;
  entity_reference: string;
  details: Record<string, any>;
  timestamp: string;
  created_at: string;
}

export const MODULES = [
  'vendors',
  'brands',
  'categories',
  'attributes',
  'products',
  'enrichment',
  'channels',
  'assets',
  'users',
] as const;

export type ModuleName = typeof MODULES[number];
