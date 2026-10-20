import React from 'react';
import { X, Check } from 'lucide-react';

export default function FilterModal({
  isOpen,
  onClose,
  sortBy,
  onSelectSort,
  filters,
  onToggleFilter,
  onResetFilters,
}) {
  if (!isOpen) return null;

  const sortOptions = [
    { id: 'alphabetical', label: 'Alfabéticamente (A-Z)' },
    { id: 'lastRead', label: 'Último leído' },
    { id: 'lastUpdated', label: 'Última actualización' },
    { id: 'unreadCount', label: 'Capítulos sin leer' },
  ];

  const filterOptions = [
    { id: 'unreadOnly', label: 'Solo no leídos' },
    { id: 'startedOnly', label: 'Solo empezados' },
    { id: 'completedOnly', label: 'Solo series completadas' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      {/* Bottom Sheet Modal */}
      <div
        className="fade-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-secondary)',
          borderTopLeftRadius: 'var(--radius-xl)',
          borderTopRightRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          padding: '20px 20px calc(var(--sab) + 24px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Filtros y Ordenación</h3>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Sort Section */}
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Ordenar por
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sortOptions.map((opt) => {
              const isSelected = sortBy === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => onSelectSort(opt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                    color: isSelected ? 'var(--accent-hover)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '14px',
                  }}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={18} color="var(--accent-hover)" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters Section */}
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Filtros
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filterOptions.map((opt) => {
              const isChecked = !!filters[opt.id];
              return (
                <div
                  key={opt.id}
                  onClick={() => onToggleFilter(opt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{opt.label}</span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', pointerEvents: 'none' }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <button
            onClick={onResetFilters}
            className="btn-secondary"
            style={{ flex: 1, padding: '10px' }}
          >
            Restablecer
          </button>
          <button
            onClick={onClose}
            className="btn-primary"
            style={{ flex: 1.5, padding: '10px' }}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
