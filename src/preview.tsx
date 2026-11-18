// Dev-only: mounts every page behind the real shell with seeded demo data, so
// design work can be looked at without signing in. Nothing imports this file
// from index.html, so it never enters the production bundle.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import './index.css';
import { AppProviders } from './context/AppProviders';
import { seedDemoData } from './lib/demoData';
import { MainLayout } from './components/layout/MainLayout';
import { Home } from './pages/Home';
import { Habits } from './pages/Habits';
import { Todo } from './pages/Todo';
import { Pomodoro } from './pages/Pomodoro';
import { Finance } from './pages/Finance';
import { Playlists } from './pages/Playlists';
import { Store } from './pages/Store';
import { Community } from './pages/Community';
import { Settings } from './pages/Settings';
import { Admin } from './pages/Admin';

// Throwaway visual harness: /preview.html?p=habits&theme=light
// Delete this file and preview.html when the UI pass is done.
const pages: Record<string, React.FC> = {
  home: Home,
  habits: Habits,
  todo: Todo,
  pomodoro: Pomodoro,
  finance: Finance,
  playlist: Playlists,
  store: Store,
  community: Community,
  settings: Settings,
  admin: Admin,
};

const params = new URLSearchParams(location.search);
const key = params.get('p') ?? 'home';
const Page = pages[key] ?? Home;

const theme = params.get('theme');
if (theme === 'light' || theme === 'dark') localStorage.setItem('theme', theme);
sessionStorage.setItem('mornigami:demo', 'true');
seedDemoData();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <MemoryRouter initialEntries={[key === 'home' ? '/' : `/${key}`]}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route path="*" element={<Page />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AppProviders>
  </React.StrictMode>
);
