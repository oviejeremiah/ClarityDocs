import { ClarityGuide } from './components/ClarityGuide/ClarityGuide';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';
import { LoginPage } from './pages/LoginPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { TeamPage } from './pages/TeamPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { ThemeSwitcher, getStoredWallpaper, type WallpaperId } from './components/ThemeSwitcher/ThemeSwitcher';
import { EvalsPage } from './pages/EvalsPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 0 } },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('clarity_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function getUserInitials(): string {
  try {
    const user = JSON.parse(localStorage.getItem('clarity_user') ?? '{}') as { name?: string };
    if (!user.name) return 'U';
    return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  } catch { return 'U'; }
}

function getUserName(): string {
  try {
    const user = JSON.parse(localStorage.getItem('clarity_user') ?? '{}') as { name?: string };
    return user.name ?? 'User';
  } catch { return 'User'; }
}

function Sidebar() {
  function handleSignOut() {
    localStorage.removeItem('clarity_token');
    localStorage.removeItem('clarity_user');
    window.location.href = '/login';
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="sidebar__logo-mark">CD</div>
        <div>
          <div className="sidebar__logo-name">ClarityDocs</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Document intelligence</div>
        </div>
      </div>
      <nav className="sidebar__nav">
        <div className="sidebar__section">Workspace</div>
        <NavLink to="/" end className={({ isActive }) => `sidebar__item${isActive ? ' active' : ''}`}>
          <i className="ti ti-files" aria-hidden="true" />
          Documents
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `sidebar__item${isActive ? ' active' : ''}`}>
          <i className="ti ti-chart-bar" aria-hidden="true" />
          Analytics
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => `sidebar__item${isActive ? ' active' : ''}`}>
          <i className="ti ti-clock-history" aria-hidden="true" />
          History
        </NavLink>
        <NavLink to="/evals" className={({ isActive }) => `sidebar__item${isActive ? ' active' : ''}`}>
          <i className="ti ti-target-arrow" aria-hidden="true" />
          Evals
        </NavLink>
        <div className="sidebar__section" style={{ marginTop: '8px' }}>Settings</div>
        <NavLink to="/team" className={({ isActive }) => `sidebar__item${isActive ? ' active' : ''}`}>
          <i className="ti ti-users" aria-hidden="true" />
          Team
        </NavLink>
        <NavLink to="/integrations" className={({ isActive }) => `sidebar__item${isActive ? ' active' : ''}`}>
          <i className="ti ti-api" aria-hidden="true" />
          Integrations
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `sidebar__item${isActive ? ' active' : ''}`}>
          <i className="ti ti-settings" aria-hidden="true" />
          Settings
        </NavLink>
      </nav>
      <div className="sidebar__bottom">
        <div className="sidebar__user" onClick={handleSignOut} title="Sign out">
          <div className="sidebar__avatar">{getUserInitials()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar__user-name">{getUserName()}</div>
            <div className="sidebar__user-role">Administrator</div>
          </div>
          <i className="ti ti-logout" aria-hidden="true" style={{ fontSize: '15px', color: 'var(--color-text-muted)', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [wallpaper, setWallpaper] = useState<WallpaperId>(getStoredWallpaper());

  return (
    <div className="app-shell">
      <Sidebar />
      <main className={`main-content main-content--wallpaper-${wallpaper}`}>
        <div style={{ position: 'absolute', top: '14px', right: '24px', zIndex: 20 }}>
          <ThemeSwitcher current={wallpaper} onChange={setWallpaper} />
        </div>
        {children}
        <ClarityGuide />
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
          <Route path="/documents/:id" element={<ProtectedRoute><AppLayout><DocumentDetailPage /></AppLayout></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AppLayout><AnalyticsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><AppLayout><HistoryPage /></AppLayout></ProtectedRoute>} />
          <Route path="/evals" element={<ProtectedRoute><AppLayout><EvalsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/team" element={<ProtectedRoute><AppLayout><TeamPage /></AppLayout></ProtectedRoute>} />
          <Route path="/integrations" element={<ProtectedRoute><AppLayout><IntegrationsPage /></AppLayout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;