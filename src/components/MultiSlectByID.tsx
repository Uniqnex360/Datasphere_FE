import { ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface Option {
  id: string;
  value: string;
  // Any extra fields are allowed but ignored by the component
  [key: string]: any;
}

interface Props {
  options: Option[];
  value: Option[];
  onChange: (value: Option[]) => void;
  placeholder?: string;
  searchable?: boolean;
  selectAllLabel?: string;
}

export function MultiSelectObjects({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchable = true,
  selectAllLabel = "Select All",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.value.toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  const allSelected = value.length === options.length;

  const toggleOption = (option: Option) => {
    if (value.some((v) => v.id === option.id)) {
      onChange(value.filter((v) => v.id !== option.id));
    } else {
      onChange([...value, option]);
    }
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleValues = value.slice(0, 2);
  const remainingCount = value.length - 2;

  return (
    <div className="relative min-w-[240px] w-full" ref={wrapperRef}>
      <div
        className="flex items-center gap-1 w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white overflow-hidden"
        onClick={() => setIsOpen(true)}
      >
        {value.length === 0 && (
          <span className="text-sm text-gray-400 truncate">{placeholder}</span>
        )}

        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
          {visibleValues.map((val) => (
            <span
              key={val.id}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded max-w-[120px] truncate"
            >
              <span className="truncate">{val.value}</span>
              <X
                size={12}
                className="cursor-pointer flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(val);
                }}
              />
            </span>
          ))}

          {remainingCount > 0 && (
            <span className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">
              +{remainingCount} more
            </span>
          )}
        </div>

        <div className="ml-2 text-gray-400 flex-shrink-0">
          <ChevronDown size={18} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[260px] bg-white border border-gray-200 rounded-lg shadow-lg max-h-[450px] overflow-y-auto">
          {searchable && (
            <div className="p-2 border-b">
              <input
                type="text"
                className="w-full px-2 py-1 text-sm border rounded outline-none"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          <div
            className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex items-center gap-2 border-b"
            onClick={toggleSelectAll}
          >
            <input type="checkbox" readOnly checked={allSelected} />
            {selectAllLabel}
          </div>

          {filteredOptions.map((option) => (
            <div
              key={option.id}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex items-center gap-2"
              onClick={() => toggleOption(option)}
            >
              <input
                type="checkbox"
                readOnly
                checked={value.some((v) => v.id === option.id)}
              />
              <span className="truncate">{option.value}</span>
            </div>
          ))}

          {filteredOptions.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
