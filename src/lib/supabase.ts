import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
console.log("supabaseUrl",supabaseUrl)
console.log("supabaseAnonKey",supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Attribute {
  id: string;
  name: string;
  attribute_type: 'text' | 'number' | 'dropdown' | 'multiselect' | 'date' | 'boolean';
  options: string[];
  is_required: boolean;
  group_name: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  sku: string;
  title: string;
  category_id: string | null;
  status: 'draft' | 'active' | 'archived';
  completeness_score: number;
  accuracy_score: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ProductAttribute {
  id: string;
  product_id: string;
  attribute_id: string;
  value: any;
  updated_at: string;
}

export interface DigitalAsset {
  id: string;
  file_name: string;
  file_url: string;
  file_type: 'image' | 'video' | 'document' | 'other';
  file_size: number;
  uploaded_by: string | null;
  created_at: string;
}

export interface Channel {
  id: string;
  name: string;
  logo_url: string;
  is_active: boolean;
  configuration: any;
  created_at: string;
}

export interface ImportJob {
  id: string;
  file_name: string;
  file_url: string;
  status: 'processing' | 'completed' | 'failed';
  total_rows: number;
  processed_rows: number;
  error_rows: number;
  error_log: any[];
  created_by: string | null;
  created_at: string;
}

export interface ExportJob {
  id: string;
  channel_id: string | null;
  file_name: string;
  file_url: string;
  status: 'processing' | 'completed' | 'failed';
  filter_criteria: any;
  total_products: number;
  created_by: string | null;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'editor' | 'viewer';
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}
