import React from 'react';
import { Link } from 'react-router-dom';
import { useBounties } from '@/context/BountiesContext';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowRight, Flame, Clock, CheckCircle2, CalendarDays, ListTodo, Timer, Wallet, Play, ShoppingBag, Sun } from 'lucide-react';

export const Home: React.FC = () => {
  const { bounties, bountyStats, countdown, claimBounty } = useBounties();

  const portals = [
    {
      to: '/habits',
      title: 'Habit Tracker',
      desc: 'Crease your routines, track consistency, and fold daily micro-habits into structure.',
      icon: CalendarDays,
      badge: 'Build Habits',
    },
    {
      to: '/todo',
      title: 'To-Do List',
      desc: 'Break your morning down into task creases. Track and prioritize essential checklists.',
      icon: ListTodo,
      badge: 'Execute Tasks',
    },
    {
      to: '/pomodoro',
      title: 'Pomogami',
      desc: 'Shape your focus blocks, creasing distractions away. Run focus sessions with ambient sounds.',
      icon: Timer,
      badge: 'Focus Blocks',
    },
    {
      to: '/finance',
      title: 'Finance Hub',
      desc: 'Track income, set a daily budget, manage your savings vault, and maintain disciplined spending.',
      icon: Wallet,
      badge: 'Manage Budget',
    },
    {
      to: '/playlist',
      title: 'Playlist Tracker',
      desc: 'Import course playlists, watch lessons, track video duration milestones, and level up.',
      icon: Play,
      badge: 'Watch & Learn',
    },
    {
      to: '/store',
      title: 'Rewards Store',
      desc: 'Exchange your hard-earned XP for beautiful pastel themes, origami avatars, and animated borders.',
      icon: ShoppingBag,
      badge: 'Unlock Rewards',
    },
  ];

  return (
    <div className="space-y-7">
      {/* App Header */}
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-primary">
          Mornigami Dashboard
        </h1>
        <p className="text-sm font-medium text-text-secondary mt-1">
          Shape your morning and fold your habits into structure.
        </p>
      </div>

      {/* Welcome Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-r from-primary/5 via-secondary/10 to-primary/5 p-6 sm:p-8 flex items-center justify-between shadow-sm">
        <div className="max-w-xl space-y-2">
          <h2 className="font-display text-xl sm:text-2xl font-black text-text-primary">
            Good morning! Ready to shape your day?
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-normal">
            Every habit folded, task completed, and timer run brings you closer to your goals.
            Unfold your potential crease by crease.
          </p>
        </div>
        <div className="shrink-0 ml-4 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-warning">
          <Sun className="h-9 w-9 sm:h-12 sm:w-12" aria-hidden="true" />
        </div>
      </div>

      {/* Daily Bounties Panel */}
      <section className="space-y-4">
        <div className="rounded-3xl border-2 border-warning/40 bg-gradient-to-br from-warning/10 via-danger/5 to-surface p-5 sm:p-6 shadow-sm">
          {/* Panel Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-warning/20 flex items-center justify-center text-xl shadow-xs">
                <Flame className="w-5 h-5 text-warning fill-warning" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-text-primary">
                  Daily Bounties
                </h3>
                <p className="text-xs text-text-secondary">
                  Complete today's challenges for massive XP bonuses!
                </p>
              </div>
            </div>

            {/* Live Midnight Countdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface text-xs font-bold text-danger shadow-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>Expires in:</span>
              <span className="font-mono tracking-wider">{countdown || '00:00:00'}</span>
            </div>
          </div>

          {/* Bounties List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(bounties || []).map((bounty) => {
              let currentCount = 0;
              if (bounty.type === 'pomodoro') currentCount = bountyStats?.pomodorosCompletedToday || 0;
              if (bounty.type === 'habit') currentCount = bountyStats?.habitsCompletedToday || 0;
              if (bounty.type === 'task') currentCount = bountyStats?.tasksCompletedToday || 0;

              const target = bounty.targetCount || 1;
              const progress = Math.min(100, Math.round((currentCount / target) * 100));
              const canClaim = !bounty.completed && currentCount >= target;

              return (
                <Card
                  key={bounty.id}
                  className="bg-surface/90 border-border/80 shadow-xs flex flex-col justify-between"
                >
                  <CardHeader className="p-4 pb-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-warning">+{bounty.xp} XP</span>
                      {bounty.completed ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-success">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Done
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-text-tertiary">
                          {currentCount} / {target}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-sm font-bold text-text-primary">
                      {bounty.title}
                    </CardTitle>
                    <p className="text-[11px] text-text-secondary line-clamp-2">
                      {bounty.desc}
                    </p>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <Progress value={progress} className="h-1.5" />
                    {canClaim ? (
                      <Button
                        size="sm"
                        onClick={() => claimBounty(bounty.id)}
                        className="w-full h-8 text-xs font-bold bg-warning hover:bg-warning/90 text-slate-900"
                      >
                        Claim +{bounty.xp} XP! 🎁
                      </Button>
                    ) : bounty.completed ? (
                      <Button size="sm" variant="secondary" disabled className="w-full h-8 text-xs">
                        Completed
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled className="w-full h-8 text-xs">
                        In Progress ({currentCount}/{bounty.targetCount})
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Portals Grid */}
      <section className="space-y-4">
        <h3 className="font-display text-xl font-bold text-text-primary">
          Core Workspaces
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {portals.map((portal) => (
            <Link
              key={portal.to}
              to={portal.to}
              className="group block p-6 rounded-3xl border border-border bg-surface hover:border-primary/40 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="p-2.5 rounded-2xl bg-background border border-border text-primary transition-transform duration-200 group-hover:scale-105">
                  <portal.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary group-hover:text-primary transition-colors">
                  {portal.badge}
                </span>
              </div>
              <h4 className="font-display text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
                {portal.title}
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed mt-2 min-h-[36px]">
                {portal.desc}
              </p>
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-1.5 text-xs font-bold text-primary">
                <span>Enter workspace</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

