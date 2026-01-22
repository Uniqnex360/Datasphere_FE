
export const validateImportFormat = (
  data: any[],
  expectedColumns: string[]
): { isValid: boolean; errorMessage?: string } => {
  if (data.length === 0) {
    return { 
      isValid: false, 
      errorMessage: "Import failed: The file contains no data." 
    };
  }

  const firstRow = data[0];
  const actualColumns = Object.keys(firstRow);
  const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
  // const unexpectedColumns = actualColumns.filter(col => !expectedColumns.includes(col));
  
  if (missingColumns.length > 0 ) {
    let errorMessage = "Import failed: The file format doesn't match the expected template.";
    
    if (missingColumns.length > 0) {
      const exampleCount = Math.min(3, missingColumns.length);
      const examples = missingColumns.slice(0, exampleCount).join(", ");
      
      errorMessage += ` Missing ${missingColumns.length} column${missingColumns.length > 1 ? 's' : ''}`;
      
      if (exampleCount > 0) {
        errorMessage += ` (e.g., ${examples}${missingColumns.length > exampleCount ? '...' : ''})`;
      }
      errorMessage += ".";
    }
    
    // if (unexpectedColumns.length > 0) {
    //   errorMessage += ` Found ${unexpectedColumns.length} unexpected column${unexpectedColumns.length > 1 ? 's' : ''}.`;
    // }
    
    errorMessage += " Please use the template provided by the 'Download Template' button.";
    // console.log('unexpectedColumns',unexpectedColumns.join(''))
    console.log('missingColumns',missingColumns.join(''))
    return { isValid: false, errorMessage };
  }
  
  return { isValid: true };
};