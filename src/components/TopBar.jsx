import React from 'react';
import { Search, Filter, Grid, List, Smartphone, Globe } from 'lucide-react';

export default function TopBar({
  title,
  subtitle,
  onSearchClick,
  onFilterClick,
  viewMode,
  onToggleViewMode,
  isSimulator,
  onToggleSimulator,
}) {
  return (
    <header
      className="ios-glass-header"
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        paddingTop: isSimulator ? '46px' : 'var(--sat)',
      }}
    >
      <div
        style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
        }}
      >
        {/* Left: Title */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1
            style={{
              fontSize: '21px',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {title}
            {title === 'Biblioteca' && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--accent-hover)',
                  background: 'var(--accent-subtle)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-active)',
                }}
              >
                iOS
              </span>
            )}
          </h1>
          {subtitle && (
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
              {subtitle}
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Simulator toggle */}
          <button
            onClick={onToggleSimulator}
            className="btn-icon"
            title={isSimulator ? "Vista pantalla completa" : "Modo Marco iPhone"}
            style={{ color: isSimulator ? 'var(--accent-hover)' : 'var(--text-secondary)' }}
          >
            <Smartphone size={19} />
          </button>

          {/* Search button */}
          {onSearchClick && (
            <button
              onClick={onSearchClick}
              className="btn-icon"
              title="Buscar manga"
            >
              <Search size={20} />
            </button>
          )}

          {/* Filter button */}
          {onFilterClick && (
            <button
              onClick={onFilterClick}
              className="btn-icon"
              title="Filtros y orden"
            >
              <Filter size={19} />
            </button>
          )}

          {/* Grid / List toggle */}
          {onToggleViewMode && (
            <button
              onClick={onToggleViewMode}
              className="btn-icon"
              title={viewMode === 'grid' ? "Ver como lista" : "Ver como cuadrícula"}
            >
              {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
