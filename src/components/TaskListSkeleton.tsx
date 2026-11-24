import type { ListDensity } from '../types/task';

interface TaskListSkeletonProps {
  density: ListDensity;
  rows?: number;
}

export function TaskListSkeleton({ density, rows = 4 }: TaskListSkeletonProps) {
  const isCompact = density === 'compact';

  return (
    <div
      data-testid="task-list-skeleton"
      aria-busy="true"
      aria-label="Loading tasks"
      className="divide-y divide-[var(--tf-divider)]"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={`flex items-start gap-3 px-4 animate-pulse ${
            isCompact ? 'py-2.5' : 'py-3.5'
          }`}
        >
          <div className="w-[18px] h-[18px] mt-0.5 rounded-[5px] bg-[var(--tf-border)] shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[var(--tf-border)] rounded w-3/5" />
            {!isCompact && <div className="h-3 bg-[var(--tf-surface-subtle)] rounded w-4/5" />}
          </div>
          <div className="h-5 w-16 bg-[var(--tf-surface-subtle)] rounded-md shrink-0" />
        </div>
      ))}
    </div>
  );
}
