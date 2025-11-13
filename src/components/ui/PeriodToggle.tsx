interface PeriodToggleProps {
  periods: Array<{ label: string; value: string }>;
  selected: string;
  onChange: (value: string) => void;
}

export function PeriodToggle({ periods, selected, onChange }: PeriodToggleProps) {
  return (
    <div className="inline-flex items-center gap-2 p-1 bg-muted rounded-lg">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          data-testid={`button-period-${period.value}`}
          className={`
            px-4 py-2 rounded-md text-sm font-medium transition-all
            ${
              selected === period.value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }
          `}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
