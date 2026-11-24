import {
  AlertCircle,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Folder,
  Inbox,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from 'lucide-react';
import type { SidebarCounts, SidebarView } from '../types/task';
import { DEFAULT_PROJECTS } from '../utils/taskLogic';

interface SidebarProps {
  activeView: SidebarView;
  selectedProject: string | null;
  counts: SidebarCounts;
  collapsed: boolean;
  mobileOpen: boolean;
  onSelectView: (view: SidebarView) => void;
  onSelectProject: (project: string) => void;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  onOpenCommandPalette: () => void;
}

const VIEW_ITEMS: Array<{
  id: SidebarView;
  label: string;
  icon: typeof Inbox;
}> = [
  { id: 'all', label: 'All Tasks', icon: Inbox },
  { id: 'today', label: 'Today', icon: Calendar },
  { id: 'upcoming', label: 'Upcoming', icon: CalendarClock },
  { id: 'overdue', label: 'Overdue', icon: AlertCircle },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
];

const PROJECT_ACCENTS: Record<string, string> = {
  Product: 'text-[rgba(99,102,241,0.95)] dark:text-[rgba(165,180,252,0.95)]',
  Engineering: 'text-[rgba(2,132,199,0.92)] dark:text-[rgba(56,189,248,0.92)]',
  Design: 'text-[rgba(217,119,6,0.92)] dark:text-[rgba(251,191,36,0.92)]',
  Personal: 'text-[rgba(5,150,105,0.92)] dark:text-[rgba(52,211,153,0.92)]',
};

export function Sidebar({
  activeView,
  selectedProject,
  counts,
  collapsed,
  mobileOpen,
  onSelectView,
  onSelectProject,
  onToggleCollapse,
  onCloseMobile,
  onOpenCommandPalette,
}: SidebarProps) {
  function handleViewClick(view: SidebarView) {
    onSelectView(view);
    onCloseMobile();
  }

  function handleProjectClick(project: string) {
    onSelectProject(project);
    onCloseMobile();
  }

  const sidebarContent = (isCompactRail: boolean, isMobileDrawer: boolean) => (
    <div className="h-full flex flex-col bg-[var(--tf-sidebar)] backdrop-blur-md border-r border-[var(--tf-border)] select-none transition-colors duration-150">
      {/* Top Brand + Collapse Row */}
      <div
        className={`h-16 flex items-center border-b border-[var(--tf-border)] shrink-0 ${
          isCompactRail ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        {!isCompactRail && (
          <div className="inline-flex items-center gap-2.5 text-[var(--tf-ink)] min-w-0">
            <span
              aria-hidden="true"
              className="w-7 h-7 rounded-lg bg-[var(--tf-accent)] text-[rgba(255,255,255,0.98)] inline-flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(79,70,229,0.34)]"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.5 10.5L8.25 14.25L15.75 6.25"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-[16px] font-semibold tracking-[-0.02em] leading-6 truncate">
              TaskFlow
            </span>
          </div>
        )}

        {isMobileDrawer ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[var(--tf-ink-secondary)] hover:text-[var(--tf-ink)] hover:bg-[var(--tf-surface-hover)] transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCompactRail ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCompactRail ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[var(--tf-ink-secondary)] hover:text-[var(--tf-ink)] hover:bg-[var(--tf-surface-hover)] transition-colors shrink-0"
          >
            {isCompactRail ? (
              <PanelLeftOpen className="w-4 h-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Quick Search / Command Trigger */}
      <div className={isCompactRail ? 'p-2' : 'px-3 pt-3 pb-2'}>
        <button
          type="button"
          onClick={() => {
            onCloseMobile();
            onOpenCommandPalette();
          }}
          aria-label="Open command palette"
          title="Search & commands (Ctrl+K)"
          className={`w-full h-9 rounded-lg bg-[var(--tf-surface)] border border-[var(--tf-border)] hover:border-[var(--tf-border-strong)] text-[var(--tf-ink-secondary)] hover:text-[var(--tf-ink)] transition-colors duration-150 flex items-center ${
            isCompactRail ? 'justify-center px-0' : 'justify-between px-2.5'
          }`}
        >
          <span className="inline-flex items-center gap-2 min-w-0">
            <Search className="w-3.5 h-3.5 text-[var(--tf-ink-muted)] shrink-0" aria-hidden="true" />
            {!isCompactRail && (
              <span className="text-[13px] text-[var(--tf-ink-muted)] truncate">Search...</span>
            )}
          </span>
          {!isCompactRail && (
            <kbd className="text-[11px] font-medium text-[var(--tf-ink-secondary)] bg-[var(--tf-surface-subtle)] border border-[var(--tf-border)] px-1.5 py-0.5 rounded-md tracking-[0.02em] shrink-0">
              ⌘K
            </kbd>
          )}
        </button>
      </div>

      {/* Primary Views */}
      <nav aria-label="Task views" className="flex-1 overflow-y-auto px-2 py-2 space-y-5">
        <div className="space-y-0.5">
          {!isCompactRail && (
            <p className="px-2.5 pb-1 text-[11px] font-semibold tracking-[0.04em] text-[var(--tf-ink-muted)]">
              Views
            </p>
          )}
          {VIEW_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = !selectedProject && activeView === item.id;
            const count = counts[item.id];
            const isOverdueAlert = item.id === 'overdue' && count > 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleViewClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                title={isCompactRail ? `${item.label} (${count})` : undefined}
                className={`w-full h-9 rounded-lg flex items-center transition-colors duration-150 text-[13px] font-medium ${
                  isCompactRail ? 'justify-center px-0' : 'justify-between px-2.5'
                } ${
                  isActive
                    ? 'bg-[var(--tf-surface-active)] text-[var(--tf-accent-ink)]'
                    : 'text-[var(--tf-ink-secondary)] hover:bg-[var(--tf-surface-hover)] hover:text-[var(--tf-ink)]'
                }`}
              >
                <span className="inline-flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? 'text-[var(--tf-accent-ink)]'
                        : isOverdueAlert
                        ? 'text-[var(--tf-danger-ink)]'
                        : 'text-[var(--tf-ink-muted)]'
                    }`}
                    aria-hidden="true"
                  />
                  {!isCompactRail && <span className="truncate">{item.label}</span>}
                </span>

                {!isCompactRail && (
                  <span
                    className={`text-[12px] tabular-nums ${
                      isActive
                        ? 'text-[var(--tf-accent-ink)]'
                        : isOverdueAlert
                        ? 'text-[var(--tf-danger-ink)] font-semibold'
                        : 'text-[var(--tf-ink-muted)]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Projects */}
        <div className="space-y-0.5 pt-2 border-t border-[var(--tf-divider)]">
          {!isCompactRail && (
            <p className="px-2.5 pb-1 text-[11px] font-semibold tracking-[0.04em] text-[var(--tf-ink-muted)]">
              Projects
            </p>
          )}
          {DEFAULT_PROJECTS.map((project) => {
            const isActive = selectedProject === project;
            const count = counts.byProject[project] ?? 0;

            return (
              <button
                key={project}
                type="button"
                onClick={() => handleProjectClick(project)}
                aria-current={isActive ? 'page' : undefined}
                title={isCompactRail ? `${project} (${count})` : undefined}
                className={`w-full h-9 rounded-lg flex items-center transition-colors duration-150 text-[13px] font-medium ${
                  isCompactRail ? 'justify-center px-0' : 'justify-between px-2.5'
                } ${
                  isActive
                    ? 'bg-[var(--tf-surface-active)] text-[var(--tf-accent-ink)]'
                    : 'text-[var(--tf-ink-secondary)] hover:bg-[var(--tf-surface-hover)] hover:text-[var(--tf-ink)]'
                }`}
              >
                <span className="inline-flex items-center gap-2.5 min-w-0">
                  <Folder
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? 'text-[var(--tf-accent-ink)]'
                        : PROJECT_ACCENTS[project] ?? 'text-[var(--tf-ink-muted)]'
                    }`}
                    aria-hidden="true"
                  />
                  {!isCompactRail && <span className="truncate">{project}</span>}
                </span>
                {!isCompactRail && (
                  <span
                    className={`text-[12px] tabular-nums ${
                      isActive ? 'text-[var(--tf-accent-ink)]' : 'text-[var(--tf-ink-muted)]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );

  return (
    <>
      <aside
        aria-label="Workspace navigation"
        data-collapsed={collapsed ? 'true' : 'false'}
        className={`hidden md:block shrink-0 h-screen sticky top-0 transition-[width] duration-200 ${
          collapsed ? 'w-16' : 'w-[260px]'
        }`}
      >
        {sidebarContent(collapsed, false)}
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex bg-[var(--tf-backdrop)] backdrop-blur-xs"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              onCloseMobile();
            }
          }}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="w-[272px] max-w-[85vw] h-full shadow-[var(--tf-shadow-2)]"
          >
            {sidebarContent(false, true)}
          </aside>
        </div>
      )}
    </>
  );
}
