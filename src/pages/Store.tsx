import React, { useState } from 'react';
import { useGamification, STORE_ITEMS } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import {
  ShoppingBag,
  Sparkles,
  Check,
  Palette,
  Smile,
  Shield,
  Coins,
  Lock,
  Unlock,
  Flame,
  Rainbow,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { StoreItem } from '@/types';

const BORDER_ICONS = {
  'spark-border': Sparkles,
  'fire-border': Flame,
  'rainbow-border': Rainbow,
} as const;

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export const Store: React.FC = () => {
  const {
    userXP,
    unlockedItems,
    activeAvatar,
    activeBorder,
    buyStoreItem,
    equipAvatar,
    equipBorder,
  } = useGamification();

  const { accentColor, setAccentColor } = useTheme();

  const [activeTab, setActiveTab] = useState<'colors' | 'avatars' | 'borders'>('colors');

  const handleAction = (category: 'colors' | 'avatars' | 'borders', item: StoreItem) => {
    const isUnlocked = unlockedItems?.[category]?.includes(item.value);

    if (isUnlocked) {
      if (category === 'colors') {
        setAccentColor(item.value);
        toast.success(`Equipped ${item.name} accent!`);
      } else if (category === 'avatars') {
        equipAvatar(item.value);
        toast.success(`Equipped ${item.name} avatar!`);
      } else if (category === 'borders') {
        equipBorder(item.value);
        toast.success(`Equipped ${item.name} animated border!`);
      }
    } else {
      if (userXP < item.cost) {
        toast.error(`You need ${item.cost} XP to unlock this item. Complete habits, tasks, or pomodoros!`);
        return;
      }
      const ok = buyStoreItem(category, item);
      if (ok) {
        toast.success(`Successfully purchased and equipped ${item.name}!`);
      }
    }
  };

  const renderItemCard = (category: 'colors' | 'avatars' | 'borders', item: StoreItem) => {
    const isUnlocked = unlockedItems?.[category]?.includes(item.value);
    const canAfford = userXP >= item.cost;
    let isEquipped = false;
    if (category === 'colors') isEquipped = accentColor === item.value;
    if (category === 'avatars') isEquipped = activeAvatar === item.value;
    if (category === 'borders') isEquipped = activeBorder === item.value;

    const BorderIcon = BORDER_ICONS[item.value as keyof typeof BORDER_ICONS];

    return (
      <Card
        key={item.id}
        className={cn(
          'flex flex-col justify-between rounded-2xl border-2 p-5 shadow-sm transition-all duration-200 ease-out',
          isEquipped
            ? 'border-primary bg-primary/5 shadow-md'
            : isUnlocked
            ? 'border-border bg-surface hover:border-primary/40 hover:shadow-md'
            : canAfford
            ? 'border-border bg-surface hover:border-success/50 hover:shadow-md'
            : 'border-dashed border-border bg-background/60 hover:border-warning/50'
        )}
      >
        <div className="space-y-3">
          {/* Visual Preview */}
          <div className="flex items-start justify-between gap-3">
            {category === 'colors' && (
              <div
                className="h-12 w-12 shrink-0 rounded-2xl border-2 border-border shadow-sm"
                style={{ backgroundColor: item.value }}
                aria-hidden="true"
              />
            )}
            {category === 'avatars' && (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-3xl shadow-sm">
                {item.value}
              </div>
            )}
            {category === 'borders' && (
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface text-text-secondary shadow-sm motion-reduce:!animate-none',
                  item.value
                )}
              >
                {BorderIcon ? (
                  <BorderIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Shield className="h-5 w-5" aria-hidden="true" />
                )}
              </div>
            )}

            <div className="flex flex-col items-end gap-1 text-right">
              {isEquipped ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
                  Equipped
                </span>
              ) : isUnlocked ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success-bg px-2 py-0.5 text-xs font-bold text-text-primary">
                  <Check className="h-3.5 w-3.5 stroke-[3] text-success" aria-hidden="true" />
                  Unlocked
                </span>
              ) : (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold',
                    canAfford
                      ? 'border-success/40 bg-success-bg text-text-primary'
                      : 'border-warning/40 bg-warning-bg text-text-primary'
                  )}
                >
                  {canAfford ? (
                    <Unlock className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
                  )}
                  {canAfford ? 'Ready to unlock' : 'Locked'}
                </span>
              )}

              <span className="inline-flex items-center gap-1 text-sm font-bold text-text-primary">
                <Coins className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
                {item.cost.toLocaleString()}
                <span className="text-xs font-semibold text-text-secondary">XP</span>
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-display text-base font-bold text-text-primary">{item.name}</h4>
            <p className="mt-0.5 text-xs text-text-secondary">{item.desc}</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 border-t border-border/60 pt-3">
          <Button
            size="sm"
            onClick={() => handleAction(category, item)}
            disabled={isEquipped}
            aria-label={
              isEquipped
                ? `${item.name} is equipped`
                : isUnlocked
                ? `Equip ${item.name}`
                : canAfford
                ? `Unlock ${item.name} for ${item.cost} XP`
                : `${item.name} costs ${item.cost} XP, you need more XP`
            }
            className={cn(
              'h-10 w-full gap-1.5 text-xs font-bold transition-all duration-150 ease-out active:scale-[0.98]',
              FOCUS_RING,
              isEquipped
                ? 'cursor-default border border-primary/20 bg-primary/10 text-primary shadow-none'
                : isUnlocked
                ? 'bg-primary text-primary-foreground hover:opacity-90'
                : canAfford
                ? 'border border-success/50 bg-success-bg text-text-primary hover:bg-success/15'
                : 'cursor-pointer border border-border bg-surface text-text-secondary hover:border-warning/50 hover:text-text-primary'
            )}
          >
            {isEquipped ? (
              <>
                <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
                <span>Equipped</span>
              </>
            ) : isUnlocked ? (
              <>
                <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
                <span>Equip Item</span>
              </>
            ) : canAfford ? (
              <>
                <Unlock className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                <span>Unlock for {item.cost} XP</span>
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
                <span>Need {item.cost} XP</span>
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-gradient-to-r from-warning/10 via-surface to-primary/5 p-6 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-text-secondary">
            <ShoppingBag className="h-5 w-5 text-warning" aria-hidden="true" />
            <span className="text-sm font-bold">Rewards &amp; customization</span>
          </div>
          <h1 className="font-display text-2xl font-black text-text-primary sm:text-3xl">
            Fold Your Aesthetic
          </h1>
          <p className="max-w-md text-xs text-text-secondary">
            Exchange your hard-earned XP progression points for sky-blue button accents,
            origami avatars, and glowing badge animations.
          </p>
        </div>

        {/* User XP Vault Indicator */}
        <div className="flex shrink-0 items-center gap-3 self-start rounded-2xl border-2 border-warning/40 bg-surface px-5 py-3 shadow-sm sm:self-auto">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/20">
            <Sparkles className="h-5 w-5 fill-warning text-warning" aria-hidden="true" />
          </div>
          <div>
            <div className="text-xs font-semibold text-text-secondary">Available XP</div>
            <div className="font-display text-xl font-black text-text-primary">
              {userXP.toLocaleString()} XP
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap p-1 sm:inline-flex sm:w-auto">
          <TabsTrigger
            value="colors"
            className={cn(
              'h-10 flex-1 cursor-pointer gap-2 px-3 text-xs font-bold sm:flex-none sm:px-4',
              FOCUS_RING
            )}
          >
            <Palette className="h-4 w-4" aria-hidden="true" />
            <span className="sm:hidden">Colors</span>
            <span className="hidden sm:inline">Accent Colors</span>
          </TabsTrigger>
          <TabsTrigger
            value="avatars"
            className={cn(
              'h-10 flex-1 cursor-pointer gap-2 px-3 text-xs font-bold sm:flex-none sm:px-4',
              FOCUS_RING
            )}
          >
            <Smile className="h-4 w-4" aria-hidden="true" />
            <span className="sm:hidden">Avatars</span>
            <span className="hidden sm:inline">Origami Avatars</span>
          </TabsTrigger>
          <TabsTrigger
            value="borders"
            className={cn(
              'h-10 flex-1 cursor-pointer gap-2 px-3 text-xs font-bold sm:flex-none sm:px-4',
              FOCUS_RING
            )}
          >
            <Shield className="h-4 w-4" aria-hidden="true" />
            <span className="sm:hidden">Borders</span>
            <span className="hidden sm:inline">Animated Borders</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="mt-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STORE_ITEMS.colors.filter((item) => !item.retired).map((item) => renderItemCard('colors', item))}
          </div>
        </TabsContent>

        <TabsContent value="avatars" className="mt-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STORE_ITEMS.avatars.map((item) => renderItemCard('avatars', item))}
          </div>
        </TabsContent>

        <TabsContent value="borders" className="mt-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {STORE_ITEMS.borders.map((item) => renderItemCard('borders', item))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
