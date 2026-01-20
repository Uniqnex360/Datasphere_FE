import * as XLSX from 'xlsx';

function normalizeColumnName(name: string): string {
  const normalized = name
    .toLowerCase()
    .replace(/\s*-\s*/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  const columnMappings: Record<string, string> = {
    'address_city': 'city',
    'addresscity': 'city',
    'vendor_address': 'address',
    'vendoraddress': 'address',
    'vendor_logo': 'vendor_logo_url',
    'vendorlogo': 'vendor_logo_url',
    'logo': 'vendor_logo_url',
    'logo_url': 'vendor_logo_url',
  };

  const mappedName = columnMappings[normalized] || normalized;

  const attributeMatch = mappedName.match(/^(attribute_(?:name|value|uom))(\d+)$/);
  if (attributeMatch) {
    return `${attributeMatch[1]}_${attributeMatch[2]}`;
  }

  const documentMatch = mappedName.match(/^document_(name|url)_(\d+)$/);
  if (documentMatch) {
    return `document_${documentMatch[2]}_${documentMatch[1]}`;
  }

  return mappedName;
}

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;

  const allKeys = Object.keys(data[0]);

  const orderedKeys: string[] = [];
  const featureKeys: string[] = [];
  const attributeKeys: string[] = [];
  const documentKeys: string[] = [];
  const imageKeys: string[] = [];
  const otherKeys: string[] = [];

  allKeys.forEach(key => {
    if (key.match(/^feature_\d+$/)) {
      featureKeys.push(key);
    } else if (key.match(/^attribute_(name|value|uom)_\d+$/)) {
      attributeKeys.push(key);
    } else if (key.match(/^document_\d+_(name|url)$/)) {
      documentKeys.push(key);
    } else if (key.match(/^image_url_\d+$/)) {
      imageKeys.push(key);
    } else {
      otherKeys.push(key);
    }
  });

  featureKeys.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || '0');
    const numB = parseInt(b.match(/\d+/)?.[0] || '0');
    return numA - numB;
  });

  attributeKeys.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || '0');
    const numB = parseInt(b.match(/\d+/)?.[0] || '0');
    if (numA !== numB) return numA - numB;
    if (a.includes('_name_')) return -1;
    if (b.includes('_name_')) return 1;
    if (a.includes('_value_')) return -1;
    if (b.includes('_value_')) return 1;
    return 0;
  });

  documentKeys.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || '0');
    const numB = parseInt(b.match(/\d+/)?.[0] || '0');
    if (numA !== numB) return numA - numB;
    if (a.includes('_name')) return -1;
    if (b.includes('_name')) return 1;
    return 0;
  });

  imageKeys.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || '0');
    const numB = parseInt(b.match(/\d+/)?.[0] || '0');
    return numA - numB;
  });

  orderedKeys.push(...otherKeys, ...featureKeys, ...attributeKeys, ...documentKeys, ...imageKeys);

  const headers = orderedKeys;
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header] ?? '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          const normalizedData = jsonData.map((row: any) => {
            const normalizedRow: any = {};
            Object.keys(row).forEach(key => {
              const normalizedKey = normalizeColumnName(key);
              normalizedRow[normalizedKey] = row[key];
            });
            return normalizedRow;
          });

          resolve(normalizedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter((line) => line.trim());
          if (lines.length === 0) {
            resolve([]);
            return;
          }

          const headers = lines[0].split(',').map((h) => normalizeColumnName(h.trim().replace(/^"|"$/g, '')));
          const data = lines.slice(1).map((line) => {
            const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            return row;
          });
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    }
  });
}
