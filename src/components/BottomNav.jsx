import React from 'react';
import { BookOpen, Bell, Clock, Compass, MoreHorizontal } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, unreadCount = 0, updatesCount = 0, extensionUpdates = 1, isSimulator = false }) {
  const tabs = [
    { id: 'library', label: 'Biblioteca', icon: BookOpen, badge: unreadCount },
    { id: 'updates', label: 'Novedades', icon: Bell, badge: updatesCount },
    { id: 'history', label: 'Historial', icon: Clock, badge: 0 },
    { id: 'browse', label: 'Explorar', icon: Compass, badge: extensionUpdates },
    { id: 'more', label: 'Más', icon: MoreHorizontal, badge: 0 },
  ];

  return (
    <nav 
      className="ios-glass-footer"
      style={{
        position: isSimulator ? 'absolute' : 'fixed',
        bottom: 0,
        left: isSimulator ? 0 : '50%',
        transform: isSimulator ? 'none' : 'translateX(-50%)',
        width: '100%',
        maxWidth: isSimulator ? '100%' : '720px',
        height: 'calc(var(--nav-height) + var(--sab))',
        paddingBottom: isSimulator ? '16px' : 'var(--sab)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              height: '100%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? 'var(--accent-hover)' : 'var(--text-tertiary)',
              transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
              padding: '6px 0',
            }}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px 16px',
                borderRadius: 'var(--radius-full)',
                background: isActive ? 'var(--accent-subtle)' : 'transparent',
                transition: 'background 0.2s ease, transform 0.15s ease',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <Icon 
                size={22} 
                strokeWidth={isActive ? 2.4 : 1.9}
                style={{
                  filter: isActive ? 'drop-shadow(0 0 10px var(--accent-glow))' : 'none',
                }}
              />
              
              {tab.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '10px',
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '8px',
                    background: 'var(--accent-primary)',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                  }}
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </div>

            <span
              style={{
                fontSize: '11px',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '-0.2px',
                opacity: isActive ? 1 : 0.85,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
