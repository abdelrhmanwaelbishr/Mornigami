import React from 'react';
import { cn } from '@/lib/utils';

type SheetProps = React.HTMLAttributes<HTMLElement>;

/**
 * A sheet: the surface unit of the ledger world. Rows are separated by
 * hairlines inside it, never by nested cards or shadows.
 */
export const Sheet: React.FC<SheetProps> = ({ className, children, ...rest }) => (
  <section {...rest} className={cn('overflow-hidden rounded-3xl border border-border bg-surface', className)}>
    {children}
  </section>
);
