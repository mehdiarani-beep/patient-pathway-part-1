import { cn } from '@/lib/utils';

interface SEOScoreGaugeProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function SEOScoreGauge({ score, label, size = 'md', showLabel = true }: SEOScoreGaugeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-lime-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 90) return 'stroke-green-500';
    if (score >= 70) return 'stroke-lime-500';
    if (score >= 50) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Work';
    return 'Poor';
  };

  const sizeClasses = {
    sm: { container: 'w-16 h-16', text: 'text-lg', label: 'text-xs' },
    md: { container: 'w-24 h-24', text: 'text-2xl', label: 'text-sm' },
    lg: { container: 'w-32 h-32', text: 'text-3xl', label: 'text-base' },
  };

  const radius = size === 'sm' ? 28 : size === 'md' ? 42 : 56;
  const strokeWidth = size === 'sm' ? 4 : size === 'md' ? 6 : 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn('relative', sizeClasses[size].container)}>
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-muted"
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn('transition-all duration-1000 ease-out', getScoreBackground(score))}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold', sizeClasses[size].text, getScoreColor(score))}>
            {score}
          </span>
        </div>
      </div>
      {showLabel && (
        <div className="text-center">
          <p className={cn('font-medium text-foreground', sizeClasses[size].label)}>{label}</p>
          <p className={cn('text-muted-foreground', size === 'sm' ? 'text-[10px]' : 'text-xs')}>
            {getScoreLabel(score)}
          </p>
        </div>
      )}
    </div>
  );
}
