
export const clearFieldError = (
  fieldName: string,
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
) => {
  setErrors((prev) => {
    if (!prev[fieldName]) return prev;

    const newErrors = { ...prev };
    delete newErrors[fieldName];
    return newErrors;
  });
};
export const formatWebsiteUrl=(url:string):string=>{
  if(!url)return ""
  let cleanUrl=url.trim().toLowerCase()
  const domain = cleanUrl.replace(/^(https?:\/\/)?(www\.)?/, "");
  cleanUrl = `https://www.${domain}`;
  // if(!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://'))
  // {
  //   cleanUrl=`https://${cleanUrl}`
  // }
  try {
    const urlObj=new URL(cleanUrl)
    return urlObj.href
  } catch (e) {
    return cleanUrl
  }
}