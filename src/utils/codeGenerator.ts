export const generateEntityCode = (entityType: 'brand' | 'vendor' | 'product' | 'category' | string,name: string,length: number = 4): string => {   
    const typePrefix=entityType.charAt(0).toUpperCase()
    const namePrefix=(name||"XXX").substring(0,3).toUpperCase()
    const randomPart=Math.floor(Math.random()*Math.pow(10,length)).toString().padStart(length,'0')
    return `${typePrefix}-${namePrefix}${randomPart}`
}
