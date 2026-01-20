export interface Category {
  category_code: string;
  industry_code: string;
  industry_name: string;
  category_1: string;
  category_2: string;
  category_3: string;
  category_4: string;
  category_5: string;
  category_6: string;
  category_7: string;
  category_8: string;
  breadcrumb: string;
  product_type: string;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryTreeNode {
  category: Category;
  children: CategoryTreeNode[];
  level: number;
}

export interface CategoryFormData extends Partial<Category> {
  parent_category_code?: string;
}
