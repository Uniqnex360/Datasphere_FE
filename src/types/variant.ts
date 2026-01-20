export interface ProductVariant {
  variant_id: string;
  parent_product_code: string;
  variant_sku: string;
  variant_mpn: string;
  variant_name: string;
  differentiating_attributes: Record<string, string>;
  upc: string;
  ean: string;
  gtin: string;
  image_1_url: string;
  image_2_url: string;
  image_3_url: string;
  price_adjustment: number;
  stock_quantity: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
