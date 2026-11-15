import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { FocusAudioPlayer } from './FocusAudioPlayer';
import { AuthModal } from '@/components/auth/AuthModal';
import { LevelUpModal } from '@/components/gamification/LevelUpModal';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const MainLayout: React.FC = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background text-text-primary selection:bg-primary selection:text-primary-foreground w-full max-w-full overflow-x-hidden">
      {/* Navigation Sidebar (Desktop) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden">
        {/* Top Header Bar */}
        <TopBar
          onOpenAuth={() => setAuthModalOpen(true)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Dynamic Routed Content */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 w-full max-w-full overflow-y-auto overflow-x-hidden pb-24 md:pb-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Navigation & Slide Drawer */}
      <MobileNav
        isOpen={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Floating Ambient Focus Audio Controller */}
      <FocusAudioPlayer />

      {/* Global Modals */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      <LevelUpModal />

      {/* Toast Notification Container */}
      <Toaster position="top-right" richColors />
    </div>
  );
};
