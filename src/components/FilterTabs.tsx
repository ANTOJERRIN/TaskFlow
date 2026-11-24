import type { TaskCounts, TaskFilter, TaskPriority } from '../types/task';

interface FilterTabsProps {
  activeFilter: TaskFilter;
  priorityFilter: TaskPriority | 'all';
  counts: TaskCounts;
  showStatusTabs?: boolean;
  onChangeStatus: (filter: TaskFilter) => void;
  onChangePriority: (priority: TaskPriority | 'all') => void;
}

const TABS: Array<{ id: TaskFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'done', label: 'Done' },
];

export function FilterTabs({
  activeFilter,
  priorityFilter,
  counts,
  showStatusTabs = true,
  onChangeStatus,
  onChangePriority,
}: FilterTabsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
      {showStatusTabs ? (
        <div
          role="tablist"
          aria-label="Filter tasks by status"
          className="inline-flex items-center gap-1 p-1 bg-[var(--tf-surface-subtle)] rounded-lg border border-[var(--tf-border)]"
        >
          {TABS.map((tab) => {
            const isSelected = activeFilter === tab.id;
            const count = counts[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onChangeStatus(tab.id)}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium transition-all duration-150 whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-[var(--tf-surface-solid)] text-[var(--tf-accent-ink)] shadow-[var(--tf-shadow-1)]'
                    : 'text-[var(--tf-ink-secondary)] hover:text-[var(--tf-ink)]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[12px] tabular-nums ${
                    isSelected ? 'text-[var(--tf-accent-ink)] opacity-85' : 'text-[var(--tf-ink-muted)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-2">
        <label htmlFor="priority-filter-select" className="sr-only">
          Filter by priority
        </label>
        <select
          id="priority-filter-select"
          aria-label="Filter by priority"
          value={priorityFilter}
          onChange={(e) => onChangePriority(e.target.value as TaskPriority | 'all')}
          className="h-9 px-3 rounded-lg bg-[var(--tf-surface)] border border-[var(--tf-border)] hover:border-[var(--tf-border-strong)] text-[13px] font-medium text-[var(--tf-ink-secondary)] focus:outline-none focus:border-[var(--tf-accent)] transition-colors"
        >
          <option value="all">All priorities</option>
          <option value="high">High priority</option>
          <option value="medium">Medium priority</option>
          <option value="low">Low priority</option>
        </select>
      </div>
    </div>
  );
}
