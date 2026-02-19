import { useRef, useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  customTruncate?: boolean;
  truncateLength?: number;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  sortKey: string;
  sortDirection: "asc" | "desc";
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
  const divRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(0);

  const updateHeight = () => {
    if (divRef.current) {
      const top = divRef.current.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      setHeight(Math.floor(windowHeight - top)); // remaining height
    }
  };

  useEffect(() => {
    updateHeight(); // calculate on mount
    window.addEventListener("resize", updateHeight); // recalc on resize
    return () => window.removeEventListener("resize", updateHeight);
  }, [data]);

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "-";
    return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
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
    // <div className="bg-white rounded-lg shadow overflow-hidden">
    //   {/* vertical scroll wrapper */}
    //   <div className="overflow-x-auto">
    //     {/* harizontal scroll wrapper */}
    //     <div className=' overflow-y-auto'>
    //     <table className="w-full border-collapse">
    //       <thead className="bg-gray-50 border-b">
    //         <tr>
    //           {columns.map((column) => (
    //             <th
    //               key={column.key}
    //               style={{ width: column.width || 'auto' }}
    //               className="px-6 py-3 text-left text-xs font-medium text-gray-500  tracking-wider"
    //             >
    //               {column.sortable ? (
    //                 <button
    //                   onClick={() => onSort(column.key)}
    //                   className="flex items-center gap-3 hover:text-gray-700 transition-colors w-full"
    //                 >
    //                   <span className="truncate">{column.label}</span>
    //                   <span className="flex-shrink-0">
    //                     {sortKey === column.key ? (
    //                       sortDirection === 'asc' ? <ChevronUp size={14} className="text-blue-600" /> : <ChevronDown size={14} className="text-blue-600" />
    //                     ) : (
    //                       <ChevronDown size={14} className="text-gray-300" />
    //                     )}
    //                   </span>
    //                 </button>
    //               ) : (
    //                 <span className="truncate ">{column.label}</span>
    //               )}
    //             </th>
    //           ))}
    //         </tr>
    //       </thead>
    //       <tbody className="bg-white divide-y divide-gray-200 overflow-y-scroll">
    //         {data.map((row, index) => (
    //           <tr key={index} className="hover:bg-gray-50 transition-colors">
    //             {columns.map((column) => (
    //               <td
    //                 key={column.key}
    //                 className="px-6 py-4 text-sm text-gray-900"
    //               >

    //                 <div
    //                   className="truncate max-w-[150px] md:max-w-[200px] lg:max-w-[300px]"
    //                   title={String(row[column.key] || '')}
    //                 >
    //                   {column.render
    //                     ? column.render(row[column.key], row)
    //                     : (row[column.key] || '-')}
    //                 </div>
    //               </td>
    //             ))}
    //           </tr>
    //         ))}
    //       </tbody>
    //     </table>
    //     </div>
    //   </div>
    // </div>
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* horizontal scroll */}
      <div className="overflow-x-auto">
        {/* vertical scroll */}
        <div ref={divRef} style={{ maxHeight: height, overflowY: "auto" }}>
          <table className="w-full border-collapse table-fixed">
            <thead className="bg-gray-50 border-b sticky top-0 z-10">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    style={{ width: column.width || "auto" }}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider"
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => onSort(column.key)}
                        className="flex items-center gap-3 hover:text-gray-700 transition-colors w-full"
                      >
                        <span className="truncate">{column.label}</span>
                        <span className="flex-shrink-0">
                          {sortKey === column.key ? (
                            sortDirection === "asc" ? (
                              <ChevronUp size={14} className="text-blue-600" />
                            ) : (
                              <ChevronDown
                                size={14}
                                className="text-blue-600"
                              />
                            )
                          ) : (
                            <ChevronDown size={14} className="text-gray-300" />
                          )}
                        </span>
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
                      {/* <div
                        className="truncate max-w-[150px] md:max-w-[200px] lg:max-w-[300px]"
                        title={String(row[column.key] || "")}
                      >
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key] || "-"}
                      </div> */}
                      {/* added custom truncate functionality */}
                      <div
                        title={String(row[column.key] || "")} // tooltip
                        className="truncate max-w-[150px] md:max-w-[200px] lg:max-w-[300px]"
                      >
                        {column.customTruncate === true
                          ? truncateText(
                              String(row[column.key]),
                              column.truncateLength ?? 15,
                            )
                          : column.render
                            ? column.render(row[column.key], row)
                            : row[column.key] || "-"}{" "}
                      
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
