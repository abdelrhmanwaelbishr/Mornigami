import React from 'react';
import { cn } from '@/lib/utils';

interface SheetHeadingProps {
  children: React.ReactNode;
  id?: string;
  icon?: React.ReactNode;
  note?: React.ReactNode;
  level?: 'h2' | 'h3';
  className?: string;
}

/** The title group of a sheet; the caller owns the row (and its aside). */
export const SheetHeading: React.FC<SheetHeadingProps> = ({
  children,
  id,
  icon,
  note,
  level: Tag = 'h2',
  className,
}) => (
  <div className={cn('flex items-center gap-2', className)}>
    {icon}
    <Tag id={id} className="font-display text-base font-bold text-text-primary">
      {children}
    </Tag>
    {note && <span className="text-xs text-text-secondary">{note}</span>}
  </div>
);
