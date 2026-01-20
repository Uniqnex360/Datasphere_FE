export interface EnrichedProduct {
  id: string;
  sku: string;
  title: string;
  description?: string;
  short_description?: string;
  primary_image?: string;
  category_id?: string | null;
  brand_id?: string | null;
  industry_id?: string | null;
  product_type?: string | null;
  completeness_score: number;
  attributes: Record<string, any>;
  images: string[];
  created_at: string;
  updated_at: string;
  ai_enrichment_status?: string;
  last_enriched_at?: string;
  ai_generated_description?: string;
  ai_generated_tags?: string[];
}
export interface EnrichmentAttribute {
  id: string;
  name: string;
  group_name: string;
  attribute_type: 'text' | 'number' | 'dropdown' | 'multiselect' | 'date' | 'boolean';
  options: string[];
  is_required: boolean;
  industry_id: string | null;
}

export interface FilterState {
  industry_id: string;
  category_id: string;
  product_type: string;
  brand_id: string;
  search: string;
  showOnlyNeedingEnrichment: boolean;
}

export interface BulkEditAction {
  type: 'fill' | 'replace' | 'clear' | 'image';
  attributeId?: string;
  value?: any;
}

export interface CellChange {
  productId: string;
  attributeId: string;
  oldValue: any;
  newValue: any;
}

export interface AISuggestion {
  id: string;
  product_id: string;
  field_name: string;
  suggested_value: any;
  confidence_score: number;
  status: 'pending' | 'accepted' | 'rejected' | 'edited';
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AIEnrichmentLog {
  id: string;
  product_id: string;
  operation_type: 'normalize' | 'enrich' | 'missing_fields' | 'completeness_score';
  input_data?: any;
  output_data?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  processing_time_ms?: number;
  created_at: string;
}
