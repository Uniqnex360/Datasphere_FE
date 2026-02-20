interface FilterSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export function FilterSelect({
  options,
  value,
  onChange,
  placeholder,
  className = "",
}: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-4 py-2 border border-gray-300 rounded-lg focus:outline-none
      focus:ring-2 focus:ring-blue-500 focus:border-transparent
      ${value === "" ? "text-gray-400" : "text-black"}
      ${className}`}
    >
      <option value="" disabled hidden>
        {placeholder}
      </option>

      {options.map((option) => (
        <option key={option} value={option} className="text-black">
          {option}
        </option>
      ))}
    </select>
  );
}