export interface Vendor {
  vendor_code: string;
  vendor_name: string;
  contact_email: string;
  country?:string;
  contact_phone: string;
  vendor_website: string;
  business_type: 'Wholesaler' | 'Manufacturer' | 'Distributor' | 'Dealer' | 'Retailer' | '';
  industry: string;
  description: string;
  address: string;
  city: string;
  tax_info: string;
  vendor_logo_url: string;
  dept1_poc_name: string;
  dept1_email: string;
  dept1_phone: string;
  dept2_poc_name: string;
  dept2_email: string;
  dept2_phone: string;
  dept3_poc_name: string;
  dept3_email: string;
  dept3_phone: string;
  dept4_poc_name: string;
  dept4_email: string;
  dept4_phone: string;
  dept5_poc_name: string;
  dept5_email: string;
  dept5_phone: string;
  created_at?: string;
  updated_at?: string;
}

export interface VendorFormData extends Partial<Vendor> {}
