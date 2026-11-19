import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useGamification, POINTS_PER_LEVEL } from '@/context/GamificationContext';
import { Trophy, Rocket, Coins } from 'lucide-react';

export const LevelUpModal: React.FC = () => {
  const { levelUpModalOpen, closeLevelUpModal, newLevelAchieved } = useGamification();

  return (
    <Dialog open={levelUpModalOpen} onOpenChange={closeLevelUpModal}>
      <DialogContent className="max-w-sm text-center p-6 motion-safe:animate-modal-pop">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-warning/15 ring-1 ring-warning/40 shadow-sm">
            <Trophy className="h-8 w-8 text-warning" aria-hidden="true" />
          </div>
          <DialogTitle className="text-3xl font-display font-black text-primary">
            Level Up!
          </DialogTitle>
          <DialogDescription className="text-sm font-semibold text-text-primary mt-1">
            Congratulations! You've ascended to{' '}
            <span className="text-primary font-extrabold text-base">
              Level {newLevelAchieved}
            </span>
            !
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-text-secondary leading-relaxed my-2">
          Your discipline and focus have elevated your discipline rank. Keep folding habits and
          conquering daily bounties!
        </p>

        <div className="mb-2 flex items-center justify-center gap-2 rounded-lg border border-warning/40 bg-warning-bg px-3 py-2">
          <Coins className="h-4 w-4 text-warning-ink" aria-hidden="true" />
          <span className="text-sm font-bold text-text-primary tabular-nums">
            +{POINTS_PER_LEVEL} Points for the Store
          </span>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            onClick={closeLevelUpModal}
            className="w-full font-bold h-11 gap-2 cursor-pointer transition-transform active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Keep Going!
            <Rocket className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
