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
        'hidden md:flex flex-col justify-between border-r border-border bg-surface transition-all duration-300 z-30 h-screen sticky top-0 shrink-0',
        minimized ? 'w-[78px]' : 'w-[250px]'
      )}
    >
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand Header */}
        <NavLink
          to="/"
          className="flex items-center gap-3 p-5 border-b border-border/60 hover:opacity-90 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-xl"
        >
          <img
            src={iconLogo}
            alt="Mornigami Logo"
            className="w-10 h-10 object-contain shrink-0 rounded-xl"
          />
          {!minimized && (
            <div className="flex flex-col leading-tight">
              <span className="font-display font-black text-xl tracking-tight text-text-primary">
                Mornigami
              </span>
              <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                Shape your Morning
              </span>
            </div>
          )}
        </NavLink>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5 p-3 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm cursor-pointer transition-colors duration-200 ease-out active:scale-[0.98] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface select-none',
                    isActive
                      ? 'bg-background text-text-primary font-semibold'
                      : 'text-text-secondary font-medium hover:bg-background/60 hover:text-text-primary'
                  )
                }
                title={minimized ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'w-5 h-5 shrink-0 transition-transform duration-200 ease-out group-hover:scale-105',
                        isActive ? 'stroke-[2.5]' : 'stroke-2'
                      )}
                    />
                    {!minimized && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Collapse/Expand Toggle Button */}
      <div className="p-3 border-t border-border/60 flex items-center justify-center">
        <button
          type="button"
          onClick={() => setMinimized((prev) => !prev)}
          className="flex items-center justify-center w-full h-9 rounded-lg border border-border text-text-secondary hover:bg-background hover:text-text-primary cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface text-xs font-semibold gap-2"
          title={minimized ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={minimized ? 'Expand sidebar menu' : 'Collapse sidebar menu'}
        >
          {minimized ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Menu</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
