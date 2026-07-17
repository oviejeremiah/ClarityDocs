import { useState } from 'react';
import { WALLPAPERS, getStoredWallpaper, type WallpaperId } from '../components/ThemeSwitcher/ThemeSwitcher';

function getUser(): { name: string; email: string; role: string } {
  try {
    return JSON.parse(localStorage.getItem('clarity_user') ?? '{}');
  } catch {
    return { name: 'User', email: '', role: 'user' };
  }
}

export function SettingsPage() {
  const user = getUser();
  const [wallpaper, setWallpaper] = useState<WallpaperId>(getStoredWallpaper());
  const [saved, setSaved] = useState(false);

  function handleWallpaperChange(id: WallpaperId) {
    localStorage.setItem('clarity_wallpaper', id);
    setWallpaper(id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    window.location.reload();
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <div className="page-header__title">Settings</div>
          <div className="page-header__sub">Manage your account and preferences</div>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: '640px' }}>
        <div className="form-container" style={{ maxWidth: 'none', marginBottom: '20px' }}>
          <div className="form-container__title">Profile</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div className="sidebar__avatar" style={{ width: '48px', height: '48px', fontSize: '16px' }}>
              {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{user.email}</div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input className="input" value={user.name} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="input" value={user.email} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <input className="input" value={user.role} disabled style={{ textTransform: 'capitalize' }} />
          </div>
        </div>

        <div className="form-container" style={{ maxWidth: 'none' }}>
          <div className="form-container__title">Appearance</div>
          <div className="form-label" style={{ marginBottom: '10px' }}>Background theme</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {WALLPAPERS.map(w => (
              <div key={w.id}>
                <div
                  className={`theme-swatch theme-swatch__${w.id}${wallpaper === w.id ? ' active' : ''}`}
                  onClick={() => handleWallpaperChange(w.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Set background to ${w.label}`}
                  onKeyDown={e => e.key === 'Enter' && handleWallpaperChange(w.id)}
                />
                <div className="theme-switcher__label">{w.label}</div>
              </div>
            ))}
          </div>
          {saved && (
            <div style={{ fontSize: '12px', color: 'var(--color-success-text)', marginTop: '12px' }}>
              <i className="ti ti-check" aria-hidden="true" style={{ marginRight: '4px' }} />
              Background updated
            </div>
          )}
        </div>
      </div>
    </>
  );
}