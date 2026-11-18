import React from 'react';
import { Check } from 'lucide-react';

interface TaskTickProps {
  onToggle: () => void;
  /** Accessible name, e.g. `Mark "Clear the inbox" done`. */
  label: string;
}

/** The 44px check affordance that closes a task. */
export const TaskTick: React.FC<TaskTickProps> = ({ onToggle, label }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={label}
    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px] border border-border bg-transparent text-transparent transition-colors duration-200 hover:border-success hover:bg-success-bg hover:text-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
  >
    <Check className="h-4 w-4" aria-hidden="true" />
  </button>
);
