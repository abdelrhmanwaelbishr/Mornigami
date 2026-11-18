import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  CircleDollarSign,
  ListTodo,
  Timer,
  Music,
  Activity,
  Users,
  ShoppingBag,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import iconLogo from '@/public/icon.png';

export const Sidebar: React.FC = () => {
  const { userRole } = useAuth();
  const [minimized, setMinimized] = useState<boolean>(() => {
    return localStorage.getItem('sidebarMinimized') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebarMinimized', minimized.toString());
  }, [minimized]);

  // Ordered by how often the day touches them, not alphabetically.
  const navItems = [
    { to: '/habits', label: 'Habits', icon: Activity },
    { to: '/todo', label: 'To-Do List', icon: ListTodo },
    { to: '/pomodoro', label: 'Pomodoro', icon: Timer },
    { to: '/finance', label: 'Finance', icon: CircleDollarSign },
    { to: '/playlist', label: 'Playlist', icon: Music },
    { to: '/community', label: 'Community', icon: Users },
    { to: '/store', label: 'Rewards Store', icon: ShoppingBag },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  if (userRole === 'admin') {
    navItems.push({ to: '/admin', label: 'Admin', icon: Shield });
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-border bg-surface z-30 h-screen sticky top-0 shrink-0 motion-safe:transition-[width] duration-200',
        minimized ? 'w-[76px]' : 'w-[248px]'
      )}
    >
      {/* Brand row is exactly the top bar's height, so the two hairlines meet. */}
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          cn(
            'flex h-16 shrink-0 items-center gap-3 border-b border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
            minimized ? 'justify-center' : 'px-4',
            isActive && 'bg-background'
          )
        }
      >
        <img src={iconLogo} alt="" className="w-8 h-8 shrink-0 object-contain" />
        {!minimized && (
          <span className="flex flex-col min-w-0 leading-tight">
            <span className="font-display font-black text-lg tracking-tight text-text-primary">
              Mornigami
            </span>
            <span className="text-[11px] font-medium text-text-secondary truncate">
              Shape your morning
            </span>
          </span>
        )}
        <span className="sr-only">Mornigami home</span>
      </NavLink>

      {/* One hairline per row: the index of the app, not a stack of cards. */}
      <nav aria-label="Main" className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-border">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  title={minimized ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-11 items-center gap-3 px-4 text-sm select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                      minimized && 'justify-center px-0',
                      isActive
                        ? minimized
                          // Collapsed there are no labels, so the active row needs a mark of its own.
                          ? 'bg-background text-text-primary shadow-[inset_2px_0_0_0_rgb(var(--color-primary))]'
                          : 'bg-background font-semibold text-text-primary'
                        : 'font-medium text-text-secondary hover:bg-background hover:text-text-primary'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          'w-5 h-5 shrink-0',
                          isActive ? 'stroke-[2.5]' : 'stroke-2'
                        )}
                      />
                      {!minimized && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border py-1.5">
        <button
          type="button"
          onClick={() => setMinimized((prev) => !prev)}
          className={cn(
            'flex h-11 w-full items-center gap-3 text-xs font-semibold text-text-secondary hover:bg-background hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
            minimized ? 'justify-center' : 'px-4'
          )}
          title={minimized ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={minimized ? 'Expand sidebar menu' : 'Collapse sidebar menu'}
        >
          {minimized ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
