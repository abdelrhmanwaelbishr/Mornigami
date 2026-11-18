import React from 'react';
import { Sun, Moon, Palette, LogIn, User as UserIcon, Shield, ShoppingBag, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGamification, STORE_ITEMS } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import { Progress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import iconLogo from '@/public/icon.png';

interface TopBarProps {
  onOpenAuth?: () => void;
  onOpenMobileMenu?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenAuth, onOpenMobileMenu }) => {
  const { user, userDoc, userRole, userNumber, signOut } = useAuth();
  const { userLevel, userXP, xpNeeded, progressPercent, activeAvatar, activeBorder, unlockedItems } = useGamification();
  const { theme, toggleTheme, accentColor, setAccentColor } = useTheme();
  const navigate = useNavigate();
  const userAvatarUrl = userDoc?.profilePicUrl || userDoc?.photoURL || user?.photoURL;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const unlockedColors = Array.isArray(unlockedItems?.colors) ? unlockedItems.colors : [];
  const unlockedColorItems = STORE_ITEMS.colors.filter((c) =>
    unlockedColors.includes(c.value)
  );

  const safeLevel = userLevel || 1;
  const safeXP = userXP || 0;
  const safeXPNeeded = xpNeeded || 500;
  const safeProgress = Math.max(0, Math.min(100, progressPercent || 0));

  return (
    <header className="h-16 px-3 sm:px-6 border-b border-border bg-surface flex items-center justify-between md:justify-end sticky top-0 z-20 shadow-xs w-full max-w-full overflow-hidden">
      {/* Mobile Menu Trigger & Brand Logo */}
      <div className="flex items-center gap-1.5 md:hidden min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="w-10 h-10 rounded-xl text-text-secondary hover:text-text-primary hover:bg-background cursor-pointer transition-all duration-200 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 hover:opacity-90 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-xl p-1 -m-1 truncate min-w-0"
        >
          <img
            src={iconLogo}
            alt="Mornigami"
            className="w-7 h-7 object-contain rounded-lg shrink-0"
          />
          <span className="font-display font-black text-base sm:text-lg text-primary tracking-tight truncate">
            Mornigami
          </span>
        </button>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 justify-end shrink-0">
        {/* 1. Accent Color Picker Dropdown (Desktop Only) */}
        <div className="hidden md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl w-10 h-10 shrink-0 cursor-pointer transition-all duration-200 ease-out hover:bg-background hover:text-text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                title="Change Accent Color"
                aria-label="Change accent color"
              >
                <Palette className="w-4 h-4 text-text-secondary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Accent Colors</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setAccentColor('')} className="flex items-center gap-2 cursor-pointer transition-colors duration-150 ease-out">
                <span className="w-4 h-4 rounded-full border border-border bg-slate-900 dark:bg-white" />
                <span>Theme Default</span>
              </DropdownMenuItem>
              {unlockedColorItems.length > 0 ? (
                unlockedColorItems.map((color) => (
                  <DropdownMenuItem
                    key={color.id}
                    onClick={() => setAccentColor(color.value)}
                    className="flex items-center gap-2 cursor-pointer transition-colors duration-150 ease-out"
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: color.value }}
                    />
                    <span>{color.name}</span>
                    {accentColor === color.value && <span className="ml-auto text-xs text-primary font-bold">✓</span>}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem
                  onClick={() => navigate('/store')}
                  className="text-xs text-text-secondary cursor-pointer flex items-center gap-2 transition-colors duration-150 ease-out"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                  <span>Unlock more in Store</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 2. Dark/Light Mode Toggle Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="rounded-xl w-10 h-10 shrink-0 cursor-pointer transition-all duration-200 ease-out hover:bg-background active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-warning" />
          ) : (
            <Moon className="w-4 h-4 text-text-secondary" />
          )}
        </Button>

        {/* Level and XP as one object: no card, no second label */}
        <button
          type="button"
          onClick={() => navigate('/store')}
          className="hidden sm:flex items-center gap-2.5 h-10 px-2 rounded-xl hover:bg-background transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface cursor-pointer select-none shrink-0"
          title={`Level ${safeLevel} · ${safeXP} of ${safeXPNeeded} XP — open the Rewards Store`}
          aria-label={`Level ${safeLevel}, ${safeXP} of ${safeXPNeeded} XP. Open the Rewards Store.`}
        >
          <span className="font-display text-sm font-black text-text-primary tabular-nums leading-none">
            L{safeLevel}
          </span>
          <span
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-sm bg-surface border border-border shrink-0 motion-safe:transition-all',
              activeBorder || ''
            )}
            aria-hidden="true"
          >
            {activeAvatar || '🌱'}
          </span>
          <span className="flex flex-col gap-1 w-24 lg:w-28">
            <span className="text-[11px] font-semibold text-text-secondary tabular-nums leading-none">
              {safeXP} / {safeXPNeeded}
            </span>
            <Progress value={safeProgress} className="h-1 motion-reduce:[&>div]:transition-none" />
          </span>
        </button>

        {/* Mobile Compact Pill (sm:hidden) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/store')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/store');
            }
          }}
          className="flex sm:hidden items-center gap-1.5 h-10 px-2 rounded-xl border border-border bg-background shrink-0 cursor-pointer hover:bg-surface active:scale-95 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface select-none"
          title={`Level ${safeLevel} • ${safeXP} / ${safeXPNeeded} XP (${safeProgress}%) - Tap to visit Store`}
          aria-label={`Level ${safeLevel}, ${safeXP} of ${safeXPNeeded} XP. Tap to visit Rewards Store.`}
        >
          <span className="text-[11px] font-black text-text-primary tabular-nums leading-none">
            L{safeLevel}
          </span>
          <span className="text-sm leading-none">{activeAvatar || '🌱'}</span>
        </div>

        {/* 4. User Profile / Login */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 h-10 px-1.5 sm:pl-2 sm:pr-3 rounded-xl border border-border bg-background hover:bg-surface cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface shrink-0"
                title="Account Menu"
                aria-label="Account Menu"
              >
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-lg object-cover shrink-0 border border-border"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs shrink-0">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-xs font-bold text-text-primary truncate max-w-[90px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  {userNumber && (
                    <span className="text-[11px] font-semibold text-text-secondary tabular-nums">
                      #{userNumber}
                    </span>
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="flex items-center gap-2.5 py-2.5">
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover shrink-0 border border-border"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm shrink-0">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-text-primary text-xs truncate">
                    {user.displayName || 'User'}
                  </span>
                  <span className="text-[11px] text-text-secondary truncate font-normal">
                    {user.email}
                  </span>
                  {userNumber && (
                    <span className="text-[11px] text-text-secondary tabular-nums">
                      User ID: #{userNumber}
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer transition-colors duration-150 ease-out">
                <UserIcon className="w-4 h-4 mr-2" />
                <span>Edit Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/store')} className="cursor-pointer transition-colors duration-150 ease-out">
                <ShoppingBag className="w-4 h-4 mr-2" />
                <span>Rewards Store</span>
              </DropdownMenuItem>
              {userRole === 'admin' && (
                <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer transition-colors duration-150 ease-out">
                  <Shield className="w-4 h-4 mr-2" />
                  <span>Admin Panel</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-danger focus:text-danger focus:bg-danger-bg cursor-pointer transition-colors duration-150 ease-out"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            onClick={onOpenAuth || (() => navigate('/login'))}
            className="rounded-xl h-10 px-4 text-xs font-bold gap-1.5 cursor-pointer transition-all duration-200 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface shrink-0"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </Button>
        )}
      </div>
    </header>
  );
};
