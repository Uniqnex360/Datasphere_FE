import { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface EditableCellProps {
  value: any;
  attributeType: 'text' | 'number' | 'dropdown' | 'multiselect' | 'date' | 'boolean';
  options?: string[];
  onChange: (value: any) => void;
  isChanged?: boolean;
}

export function EditableCell({
  value,
  attributeType,
  options = [],
  onChange,
  isChanged = false,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (attributeType === 'boolean') {
    return (
      <div className="flex items-center justify-center">
        <button
          onClick={() => onChange(!value)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            value ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              value ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className={`px-3 py-2 min-h-[38px] cursor-pointer hover:bg-gray-50 rounded border ${
          isChanged ? 'border-blue-300 bg-blue-50' : 'border-transparent'
        }`}
      >
        {value || <span className="text-gray-400 italic">Click to edit</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {attributeType === 'dropdown' ? (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={tempValue || ''}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : attributeType === 'number' ? (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="number"
          value={tempValue || ''}
          onChange={(e) => setTempValue(parseFloat(e.target.value) || '')}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : attributeType === 'date' ? (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="date"
          value={tempValue || ''}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={tempValue || ''}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
      <button
        onClick={handleSave}
        className="p-1 text-green-600 hover:bg-green-50 rounded"
      >
        <Check size={16} />
      </button>
      <button
        onClick={handleCancel}
        className="p-1 text-red-600 hover:bg-red-50 rounded"
      >
        <X size={16} />
      </button>
    </div>
  );
}
