interface CompletenessScoreProps {
  score: number;
  onClick?: () => void;
}

export function CompletenessScore({ score, onClick }: CompletenessScoreProps) {
  const getColor = () => {
    if (score < 50) return 'text-red-600 bg-red-50 border-red-200';
    if (score < 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStrokeColor = () => {
    if (score < 50) return '#dc2626';
    if (score < 70) return '#ca8a04';
    return '#16a34a';
  };

  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center w-16 h-16 rounded-full border-2 ${getColor()} cursor-pointer hover:shadow-md transition-shadow relative`}
    >
      <svg className="absolute inset-0 -rotate-90" width="64" height="64">
        <circle
          cx="32"
          cy="32"
          r="18"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          opacity="0.2"
        />
        <circle
          cx="32"
          cy="32"
          r="18"
          stroke={getStrokeColor()}
          strokeWidth="3"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-sm font-bold relative z-10">{score}%</span>
    </button>
  );
}
