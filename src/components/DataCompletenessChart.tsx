interface CompletenessData {
  name: string;
  completeness: number;
  total_products: number;
  complete_products: number;
}

interface DataCompletenessChartProps {
  data: CompletenessData[];
  title: string;
}

export function DataCompletenessChart({ data, title }: DataCompletenessChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No data available</p>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => b.completeness - a.completeness);

  return (
    <div className="space-y-3">
      {sortedData.map((item, index) => {
        const getCompletenessColor = (percent: number) => {
          if (percent >= 80) return 'bg-green-500';
          if (percent >= 60) return 'bg-yellow-500';
          if (percent >= 40) return 'bg-orange-500';
          return 'bg-red-500';
        };

        const colorClass = getCompletenessColor(item.completeness);

        return (
          <div key={`${item.name}-${index}`} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs text-gray-500">
                      {item.complete_products}/{item.total_products}
                    </span>
                    <span className={`text-sm font-bold ${
                      item.completeness >= 80 ? 'text-green-600' :
                      item.completeness >= 60 ? 'text-yellow-600' :
                      item.completeness >= 40 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {item.completeness}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`${colorClass} h-3 rounded-full transition-all duration-500`}
                style={{ width: `${item.completeness}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
