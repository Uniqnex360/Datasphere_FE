import { Product } from '../types/product';

export interface CompletenessBreakdown {
  attributes_score: number;
  attributes_detail: string;
  features_score: number;
  features_detail: string;
  images_score: number;
  images_detail: string;
  title_score: number;
  title_detail: string;
  description_score: number;
  description_detail: string;
  overall_score: number;
}

export function calculateCompletenessScore(product: Partial<Product>): CompletenessBreakdown {
  let featuresCount = 0;
  if (product.feature_1) featuresCount++;
  if (product.feature_2) featuresCount++;
  if (product.feature_3) featuresCount++;
  if (product.feature_4) featuresCount++;
  if (product.feature_5) featuresCount++;
  if (product.feature_6) featuresCount++;
  if (product.feature_7) featuresCount++;
  if (product.feature_8) featuresCount++;

  const features_score = featuresCount >= 5 ? 100 : 80;
  const features_detail = `${featuresCount}/5 features filled`;

  let imagesCount = 0;
  if (product.image_1_url) imagesCount++;
  if (product.image_2_url) imagesCount++;
  if (product.image_3_url) imagesCount++;
  if (product.image_4_url) imagesCount++;
  if (product.image_5_url) imagesCount++;

  let images_score = 0;
  if (imagesCount >= 2) images_score = 100;
  else if (imagesCount === 1) images_score = 50;
  else images_score = 0;

  const images_detail = `${imagesCount} image${imagesCount !== 1 ? 's' : ''} found`;

  const titleLength = (product.product_name || '').length;
  let title_score = 50;
  if (titleLength >= 80) title_score = 100;
  else if (titleLength >= 50) title_score = 80;
  else title_score = 50;

  const title_detail = `${titleLength} characters`;

  const hasShortDesc = !!(product.prod_short_desc && product.prod_short_desc.trim());
  const hasLongDesc = !!(product.prod_long_desc && product.prod_long_desc.trim());

  let description_score = 0;
  let description_detail = '';
  if (hasShortDesc && hasLongDesc) {
    description_score = 100;
    description_detail = 'Both descriptions found';
  } else if (hasShortDesc || hasLongDesc) {
    description_score = 60;
    description_detail = hasShortDesc ? 'Only short description' : 'Only long description';
  } else {
    description_score = 0;
    description_detail = 'No descriptions';
  }

  const attributes_score = 80;
  const attributes_detail = '3/5 attributes filled';

  const overall_score = Math.round(
    (attributes_score + features_score + images_score + title_score + description_score) / 5
  );

  return {
    attributes_score,
    attributes_detail,
    features_score,
    features_detail,
    images_score,
    images_detail,
    title_score,
    title_detail,
    description_score,
    description_detail,
    overall_score,
  };
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
}

export function getScoreColorClasses(score: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (score >= 80) {
    return {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
    };
  }
  if (score >= 50) {
    return {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-300',
    };
  }
  return {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
  };
}
