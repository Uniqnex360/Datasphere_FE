// export const generateEntityCode = (entityType: 'brand' | 'vendor' | 'product' | 'category' | string,name: string,length: number = 4): string => {   
//     const typePrefix=entityType.charAt(0).toUpperCase()
//     const namePrefix=(name||"XXX").substring(0,3).toUpperCase()
//     const randomPart=Math.floor(Math.random()*Math.pow(10,length)).toString().padStart(length,'0')
//     return `${typePrefix}-${namePrefix}${randomPart}`
// }

export const generateEntityCode = (
  entityType: 'brand' | 'vendor' | 'product' | 'category' | string,
  name: string,
  existingCodes: string[] = [] 
): string => {
  const typePrefix = entityType.charAt(0).toUpperCase();

  const sanitizedName = (name || "XXX")
    .replace(/[^a-zA-Z0-9]/g, "") 
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, "X");

  const prefix = `${typePrefix}-${sanitizedName}-`;
  
  const sequenceNumbers = existingCodes
    .filter((code) => code.startsWith(prefix))
    .map((code) => {
      const parts = code.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      return isNaN(num) ? 0 : num;
    });

  const nextNumber = sequenceNumbers.length > 0 
    ? Math.max(...sequenceNumbers) + 1 
    : 1;

  const formattedNumber = nextNumber.toString().padStart(2, "0");
  return `${prefix}${formattedNumber}`;
};