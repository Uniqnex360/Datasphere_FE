export interface Brand {
  id?:string
  brand_code: string;
  brand_name: string;
  brand_logo: string;
  mfg_code: string;
  mfg_name: string;
  mfg_logo: string;
  is_active?:boolean;
  created_at?: string;
  updated_at?: string;
  brand_website?:string
  manufacturer_website?:string
}

export interface BrandFormData extends Partial<Brand> {}
