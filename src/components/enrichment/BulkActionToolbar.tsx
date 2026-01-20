import { Copy, Replace, Eraser, Image, Wand2 } from 'lucide-react';

interface BulkActionToolbarProps {
  selectedCount: number;
  onFillValue: () => void;
  onReplace: () => void;
  onClear: () => void;
  onBulkImage: () => void;
}

export function BulkActionToolbar({
  selectedCount,
  onFillValue,
  onReplace,
  onClear,
  onBulkImage,
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-blue-900">
          {selectedCount} product{selectedCount !== 1 ? 's' : ''} selected
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={onFillValue}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 text-sm font-medium"
          >
            <Copy size={16} />
            Fill Attribute Value
          </button>

          <button
            onClick={onReplace}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 text-sm font-medium"
          >
            <Replace size={16} />
            Bulk Replace
          </button>

          <button
            onClick={onClear}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 text-sm font-medium"
          >
            <Eraser size={16} />
            Clear Value
          </button>

          <button
            onClick={onBulkImage}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 text-sm font-medium"
          >
            <Image size={16} />
            Add Image
          </button>

          <button
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 text-sm font-medium"
          >
            <Wand2 size={16} />
            Generate Description
          </button>
        </div>
      </div>
    </div>
  );
}
