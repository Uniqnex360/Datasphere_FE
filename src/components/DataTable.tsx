import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string; // Add this to control width from parent
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  sortKey: string;
  sortDirection: 'asc' | 'desc';
  onSort: (key: string) => void;
  isLoading?: boolean;
}

export default function DataTable({
  columns,
  data,
  sortKey,
  sortDirection,
  onSort,
  isLoading = false,
}: DataTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-8 text-center text-gray-500">No data found</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        {/* Added 'table-fixed' to stop the table from expanding based on text */}
        <table className="w-full table-fixed border-collapse"> 
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  // We apply the width to the header
                  style={{ width: column.width || 'auto' }}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.sortable ? (
                    <button
                      onClick={() => onSort(column.key)}
                      className="flex items-center gap-2 hover:text-gray-700 transition-colors w-full"
                    >
                      <span className="truncate">{column.label}</span>
                      {sortKey === column.key && (
                        <span className="flex-shrink-0">
                          {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </button>
                  ) : (
                    <span className="truncate">{column.label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                {columns.map((column) => (
                  <td 
                    key={column.key} 
                    className="px-6 py-4 text-sm text-gray-900"
                  >
                    {/* 
                       Removed 'whitespace-nowrap'. 
                       Added a div with 'truncate' to handle long words.
                    */}
                    <div className="truncate" title={String(row[column.key] || '')}>
                      {column.render 
                        ? column.render(row[column.key], row) 
                        : (row[column.key] || '-')}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}