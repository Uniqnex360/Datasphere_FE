export interface Brand {
  brand_code: string;
  brand_name: string;
  brand_logo: string;
  mfg_code: string;
  mfg_name: string;
  mfg_logo: string;
  created_at?: string;
  updated_at?: string;
}

export interface BrandFormData extends Partial<Brand> {}
