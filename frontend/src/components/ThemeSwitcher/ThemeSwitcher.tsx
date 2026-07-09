import { useState, useEffect, useRef } from 'react';

export const WALLPAPERS = [
  { id: 'default', label: 'Default' },
  { id: 'slate', label: 'Slate' },
  { id: 'mesh', label: 'Mesh' },
  { id: 'dots', label: 'Dots' },
  { id: 'grid', label: 'Grid' },
  { id: 'warm', label: 'Warm' },
  { id: 'dark', label: 'Dark' },
] as const;

export type WallpaperId = (typeof WALLPAPERS)[number]['id'];

const STORAGE_KEY = 'clarity_wallpaper';

export function getStoredWallpaper(): WallpaperId {
  const stored = localStorage.getItem(STORAGE_KEY);
  return (WALLPAPERS.find((w) => w.id === stored)?.id ?? 'default') as WallpaperId;
}

export function ThemeSwitcher({
  current,
  onChange,
}: {
  current: WallpaperId;
  onChange: (id: WallpaperId) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function select(id: WallpaperId) {
    localStorage.setItem(STORAGE_KEY, id);
    onChange(id);
    setOpen(false);
  }

  return (
    <div className="theme-switcher" ref={ref}>
      <button
        className="btn btn--secondary btn--sm theme-switcher__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change background"
        title="Change background"
      >
        <i className="ti ti-palette" aria-hidden="true" style={{ fontSize: '14px' }} />
        Background
      </button>

      {open && (
        <div className="theme-switcher__panel">
          <div className="theme-switcher__title">Choose a background</div>
          <div className="theme-switcher__grid">
            {WALLPAPERS.map((w) => (
              <div key={w.id}>
                <div
                  className={`theme-swatch theme-swatch__${w.id}${current === w.id ? ' active' : ''}`}
                  onClick={() => select(w.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Set background to ${w.label}`}
                  onKeyDown={(e) => e.key === 'Enter' && select(w.id)}
                />
                <div className="theme-switcher__label">{w.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}