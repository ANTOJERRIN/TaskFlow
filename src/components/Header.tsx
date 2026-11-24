import { AlignJustify, List, Menu, Moon, Plus, Search, Sun } from 'lucide-react';
import type { ListDensity, ThemeMode } from '../types/task';

interface HeaderProps {
  sectionLabel: string;
  viewTitle: string;
  density: ListDensity;
  theme: ThemeMode;
  onToggleDensity: () => void;
  onToggleTheme: () => void;
  onOpenMobileMenu: () => void;
  onOpenCommandPalette: () => void;
  onOpenNewTask: () => void;
}

export function Header({
  sectionLabel,
  viewTitle,
  density,
  theme,
  onToggleDensity,
  onToggleTheme,
  onOpenMobileMenu,
  onOpenCommandPalette,
  onOpenNewTask,
}: HeaderProps) {
  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-20 bg-[var(--tf-header)] backdrop-blur-md border-b border-[var(--tf-border)] transition-colors duration-150">
      <div className="max-w-[848px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="md:hidden w-9 h-9 -ml-1 inline-flex items-center justify-center rounded-lg text-[var(--tf-ink-secondary)] hover:text-[var(--tf-ink)] hover:bg-[var(--tf-surface-hover)] transition-colors shrink-0"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>

          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[14px] min-w-0">
            <span className="hidden sm:inline text-[var(--tf-ink-muted)] whitespace-nowrap">
              {sectionLabel}
            </span>
            <span aria-hidden="true" className="hidden sm:inline text-[var(--tf-border-strong)]">
              /
            </span>
            <span className="font-semibold tracking-[-0.01em] text-[var(--tf-ink)] truncate">
              {viewTitle}
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            aria-label="Search and commands"
            title="Search & commands (Ctrl+K)"
            className="md:hidden w-9 h-9 inline-flex items-center justify-center rounded-lg text-[var(--tf-ink-secondary)] hover:text-[var(--tf-ink)] hover:bg-[var(--tf-surface-hover)] transition-colors"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onToggleDensity}
            aria-label={
              density === 'relaxed'
                ? 'Switch to compact density'
                : 'Switch to relaxed density'
            }
            aria-pressed={density === 'compact'}
            title={density === 'relaxed' ? 'Compact density' : 'Relaxed density'}
            className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-[var(--tf-ink-secondary)] hover:text-[var(--tf-ink)] hover:bg-[var(--tf-surface-hover)] text-[13px] font-medium transition-colors whitespace-nowrap shrink-0"
          >
            {density === 'relaxed' ? (
              <AlignJustify className="w-4 h-4" aria-hidden="true" />
            ) : (
              <List className="w-4 h-4 text-[var(--tf-accent-ink)]" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {density === 'relaxed' ? 'Relaxed' : 'Compact'}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={isDark}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[var(--tf-ink-secondary)] hover:text-[var(--tf-ink)] hover:bg-[var(--tf-surface-hover)] transition-colors shrink-0"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[rgba(251,191,36,0.95)]" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenNewTask}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg bg-[var(--tf-surface)] hover:bg-[var(--tf-surface-hover)] active:scale-[0.98] text-[var(--tf-ink)] border border-[var(--tf-border)] hover:border-[var(--tf-border-strong)] text-[14px] font-medium transition-all duration-150 whitespace-nowrap shrink-0 shadow-[var(--tf-shadow-1)]"
          >
            <Plus className="w-4 h-4 stroke-[2.2] text-[var(--tf-accent-ink)]" aria-hidden="true" />
            <span>New Task</span>
          </button>
        </div>
      </div>
    </header>
  );
}
