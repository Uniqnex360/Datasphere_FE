import { Product } from "../types/product";

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

export function calculateCompletenessScore(
  product: Partial<Product>,
): CompletenessBreakdown {
  let featuresCount = 0;
  console.log(product.feature_1);
  // @ts-ignore
  if (product?.features_1) featuresCount++;
  // @ts-ignore
  if (product?.features_2) featuresCount++;
  // @ts-ignore
  if (product?.features_3) featuresCount++;
  // @ts-ignore
  if (product?.features_4) featuresCount++;
  // @ts-ignore
  if (product?.features_5) featuresCount++;
  // @ts-ignore
  if (product?.features_6) featuresCount++;
  // @ts-ignore
  if (product?.features_7) featuresCount++;
  // @ts-ignore
  if (product.features_8) featuresCount++;
  const features_score =
    featuresCount >= 5 ? 100 : Math.round((featuresCount / 5) * 100);
  const features_detail = `${featuresCount}/5 features filled`;

  // let imagesCount = 0;
  // //@ts-ignore
  // let images = product.images
  // console.log("images", images)
  // if (product.image_1_url) imagesCount++;
  // if (product.image_2_url) imagesCount++;
  // if (product.image_3_url) imagesCount++;
  // if (product.image_4_url) imagesCount++;
  // if (product.image_5_url) imagesCount++;

  // let images_score = 0;
  // if (imagesCount >= 2) images_score = 100;
  // else if (imagesCount === 1) images_score = 50;
  // else images_score = 0;

  let imagesCount = 0;
  //@ts-ignore
  const images = product.images || {};

  // Count valid image URLs
  imagesCount = Object.values(images).filter(
    //@ts-ignore
    (img) => img?.url && img.url.trim(),
  ).length;

  let images_score = 0;

  if (imagesCount >= 2) {
    images_score = 100;
  } else if (imagesCount === 1) {
    images_score = 50;
  } else {
    images_score = 0;
  }

  const images_detail = `${imagesCount} image${imagesCount !== 1 ? "s" : ""} found`;

  const titleLength = (product.product_name || "").length;
  let title_score = 0;
  if (titleLength >= 80) title_score = 100;
  else if (titleLength >= 50) title_score = 80;
  else if (titleLength >= 30) title_score = 40;
  else title_score = 0;

  const title_detail = `${titleLength} characters`;

  const hasShortDesc = !!(
    product.short_description && product.short_description.trim()
  );
  const hasLongDesc = !!(
    product.long_description && product.long_description.trim()
  );

  let description_score = 0;
  let description_detail = "";
  if (hasShortDesc && hasLongDesc) {
    description_score = 100;
    description_detail = "Both descriptions found";
  } else if (hasShortDesc || hasLongDesc) {
    description_score = 60;
    description_detail = hasShortDesc
      ? "Only short description"
      : "Only long description";
  } else {
    description_score = 0;
    description_detail = "No descriptions";
  }

  let attributes_score = 0;
  let attributes_detail = "No attributes";

  const attributes = product.attributes || {};
  const attributeList = Object.values(attributes);

  const filledAttributes = attributeList.filter(
    (attr: any) =>
      attr.selected_values &&
      attr.selected_values.length > 0 &&
      attr.selected_values.some((v: any) => v.value && v.value.trim() !== ""),
  ).length;

  const maxAttributesForScore = 5;

  if (filledAttributes > 0) {
    const scoreBase = Math.min(filledAttributes, maxAttributesForScore);

    attributes_score = Math.round((scoreBase / maxAttributesForScore) * 100);

    attributes_detail = `${filledAttributes}/${maxAttributesForScore} fields`;
  } else {
    attributes_score = 0;
    attributes_detail = `0/${maxAttributesForScore} fields`;
  }

  const overall_score = Math.round(
    (attributes_score +
      features_score +
      images_score +
      title_score +
      description_score) /
      5,
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
  if (score >= 80) return "green";
  if (score >= 50) return "yellow";
  return "red";
}

export function getScoreColorClasses(score: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (score >= 80) {
    return {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-300",
    };
  }
  if (score >= 50) {
    return {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-300",
    };
  }
  return {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-300",
  };
}
