import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  /** One line under the title: what this page does, or where it stands. */
  note?: React.ReactNode;
  /** Buttons and links that act on the whole page. */
  actions?: React.ReactNode;
  id?: string;
  className?: string;
}

/** The opening of a page: the one h1, its note, and the page's actions. */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, note, actions, id, className }) => (
  <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
    <div className="min-w-0">
      <h1
        id={id}
        className="font-display text-3xl font-black tracking-tight text-text-primary sm:text-4xl"
      >
        {title}
      </h1>
      {note && <p className="mt-1 text-sm font-medium text-text-secondary">{note}</p>}
    </div>

    {actions && <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">{actions}</div>}
  </header>
);
