export interface Channel {
  id: string;
  channel_name: string;
  channel_status: 'active' | 'inactive';
  template_headers: string[];
  last_export_date?: string;
  products_mapped_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChannelFieldMapping {
  id: string;
  channel_id: string;
  pim_field: string;
  channel_field: string;
  mapping_type: 'direct' | 'static' | 'concatenation';
  static_value?: string;
  concatenation_pattern?: string;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChannelExport {
  id: string;
  channel_id: string;
  export_date: string;
  product_count: number;
  file_url: string;
  filters_applied: ExportFilters;
  status: 'success' | 'failed' | 'processing';
  created_at: string;
}

export interface ExportFilters {
  scope: 'all' | 'category' | 'brand' | 'industry' | 'status' | 'selected';
  category_code?: string;
  brand_code?: string;
  industry_code?: string;
  status?: string;
  selected_skus?: string[];
}
