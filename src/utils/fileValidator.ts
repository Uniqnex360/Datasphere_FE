
export const isValidInventoryFile = (file: File): boolean => {
  const allowedExtensions = ['csv', 'xlsx', 'xls'];
  const allowedMimeTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/csv'
  ];

  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  const hasValidMimeType = allowedMimeTypes.includes(file.type);
  
  const hasValidExtension = !!fileExtension && allowedExtensions.includes(fileExtension);

  return hasValidMimeType || hasValidExtension;
};