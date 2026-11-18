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
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:border focus:border-border focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-text-primary"
      >
        Skip to content
      </a>

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
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 p-3 sm:p-6 lg:p-8 w-full max-w-full overflow-y-auto overflow-x-hidden pb-24 md:pb-8 focus:outline-none"
        >
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
      {/* Receipts sit below the 64px bar instead of on top of it. */}
      <Toaster position="top-right" richColors offset={{ top: 76, right: 16 }} />
    </div>
  );
};
