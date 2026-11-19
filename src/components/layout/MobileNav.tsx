import React, { useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ListTodo,
  Timer,
  Activity,
  CircleDollarSign,
  Menu,
  X,
  Home,
  Music,
  Users,
  ShoppingBag,
  Settings,
  Shield,
  Sun,
  Moon,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import { Progress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import iconLogo from '@/public/icon.png';

interface MobileNavProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenAuth?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onOpenChange,
  onOpenAuth,
}) => {
  const { user, userRole, signOut } = useAuth();
  const { userLevel, userXP, xpNeeded, progressPercent, activeAvatar, activeBorder } = useGamification();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Close drawer automatically on route change
  useEffect(() => {
    onOpenChange(false);
  }, [location.pathname, onOpenChange]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    onOpenChange(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  const safeLevel = userLevel || 1;
  const safeXP = userXP || 0;
  const safeXPNeeded = xpNeeded || 500;
  const safeProgress = Math.max(0, Math.min(100, progressPercent || 0));

  // 4 Primary bottom tabs
  const bottomTabs = [
    { to: '/todo', label: 'Tasks', icon: ListTodo },
    { to: '/pomodoro', label: 'Focus', icon: Timer },
    { to: '/habits', label: 'Habits', icon: Activity },
    { to: '/finance', label: 'Finance', icon: CircleDollarSign },
  ];

  // Full drawer navigation list — same order and wording as the desktop sidebar
  const drawerLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/habits', label: 'Habits', icon: Activity },
    { to: '/todo', label: 'To-Do List', icon: ListTodo },
    { to: '/pomodoro', label: 'Pomodoro', icon: Timer },
    { to: '/finance', label: 'Finance', icon: CircleDollarSign },
    { to: '/playlist', label: 'Playlist', icon: Music },
    { to: '/community', label: 'Community', icon: Users },
    { to: '/store', label: 'Store', icon: ShoppingBag },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  if (userRole === 'admin') {
    drawerLinks.push({ to: '/admin', label: 'Admin', icon: Shield });
  }

  return (
    <>
      {/* 1. Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-around px-1 py-1.5 shadow-lg safe-area-pb"
      >
        {bottomTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.to;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl cursor-pointer transition-all duration-200 ease-out active:scale-95 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface group',
                isActive
                  ? 'text-text-primary font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <div
                className={cn(
                  'w-9 h-7 flex items-center justify-center rounded-lg transition-colors duration-200 ease-out',
                  isActive
                    ? 'bg-background text-text-primary'
                    : 'text-text-secondary group-hover:text-text-primary group-hover:bg-background'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 transition-transform duration-200',
                    isActive ? 'stroke-[2.5]' : 'stroke-2'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[11px] mt-0.5 tracking-tight leading-none transition-colors duration-200',
                  isActive ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'
                )}
              >
                {tab.label}
              </span>
            </NavLink>
          );
        })}

        {/* 5th Tab: Menu Trigger Button */}
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl cursor-pointer transition-all duration-200 ease-out active:scale-95 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface group',
            isOpen
              ? 'text-text-primary font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          )}
          aria-label="Open full menu"
        >
          <div
            className={cn(
              'w-9 h-7 flex items-center justify-center rounded-lg transition-colors duration-200 ease-out',
              isOpen
                ? 'bg-background text-text-primary'
                : 'text-text-secondary group-hover:text-text-primary group-hover:bg-background'
            )}
          >
            <Menu
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                isOpen ? 'stroke-[2.5]' : 'stroke-2'
              )}
            />
          </div>
          <span
            className={cn(
              'text-[11px] mt-0.5 tracking-tight leading-none transition-colors duration-200',
              isOpen ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'
            )}
          >
            Menu
          </span>
        </button>
      </nav>

      {/* 2. Slide-out Navigation Drawer (Sheet) */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 motion-reduce:transition-none"
            aria-hidden="true"
          />

          {/* Slide Drawer Panel */}
          <aside className="relative w-80 max-w-[85vw] h-full bg-surface border-r border-border flex flex-col shadow-2xl z-10 motion-safe:animate-in motion-safe:slide-in-from-left motion-safe:duration-250 motion-reduce:transition-none">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <NavLink
                to="/"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-2.5 rounded-xl cursor-pointer hover:opacity-90 transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface p-1 -m-1"
              >
                <img
                  src={iconLogo}
                  alt="Mornigami"
                  className="w-8 h-8 object-contain rounded-xl shrink-0"
                />
                <div className="flex flex-col leading-tight">
                  <span className="font-display font-black text-lg tracking-tight text-text-primary">
                    Mornigami
                  </span>
                  <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                    Shape your morning
                  </span>
                </div>
              </NavLink>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 rounded-xl text-text-secondary hover:text-text-primary hover:bg-background cursor-pointer transition-all duration-200 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Level & XP Mini Banner */}
            <div className="p-3 mx-3 my-2.5 bg-background rounded-2xl border border-border flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-sm bg-surface border border-border shrink-0 motion-safe:transition-all',
                      activeBorder || ''
                    )}
                  >
                    {activeAvatar || '🌱'}
                  </div>
                  <span className="text-xs font-bold text-text-primary">
                    Level {safeLevel} Achiever
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-text-primary bg-primary/10 px-2 py-0.5 rounded-full tabular-nums">
                  {safeProgress}%
                </span>
              </div>
              <Progress value={safeProgress} className="h-1.5 motion-reduce:[&>div]:transition-none" />
              <div className="flex justify-between text-[11px] text-text-secondary font-medium tabular-nums">
                <span>{safeXP} XP</span>
                <span>{safeXPNeeded} XP Needed</span>
              </div>
            </div>

            {/* Scrollable Navigation Links */}
            <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
              {drawerLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                      isActive
                        ? 'bg-background text-text-primary font-semibold'
                        : 'text-text-secondary font-medium hover:bg-background hover:text-text-primary'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-transform duration-200',
                        isActive ? 'stroke-[2.5]' : 'stroke-2'
                      )}
                    />
                    <span className="truncate">{link.label}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-3 border-t border-border flex flex-col gap-2 bg-surface safe-area-pb">
              {/* Theme toggle row */}
              <div className="flex items-center justify-between px-2 py-1.5 bg-background rounded-xl border border-border text-xs font-semibold">
                <span className="text-text-secondary">App Appearance</span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-surface border border-border text-text-primary hover:bg-background cursor-pointer active:scale-95 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                  {theme === 'dark' ? (
                    <>
                      <Moon className="w-3.5 h-3.5 text-secondary" />
                      <span>Dark</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-3.5 h-3.5 text-warning" />
                      <span>Light</span>
                    </>
                  )}
                </button>
              </div>

              {/* User Auth Action */}
              {user ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-danger hover:bg-danger-bg cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    onOpenAuth?.();
                  }}
                  className="w-full h-10 rounded-xl text-xs font-bold gap-1.5 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In / Register</span>
                </Button>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
