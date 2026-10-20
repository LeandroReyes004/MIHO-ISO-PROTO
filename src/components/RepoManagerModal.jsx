import React, { useState } from 'react';
import { X, Plus, RefreshCw, Trash2, Globe, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { repoService } from '../services/repoService';

export default function RepoManagerModal({ isOpen, onClose, onReposUpdated }) {
  const [repos, setRepos] = useState(repoService.getRepositories());
  const [repoUrl, setRepoUrl] = useState('');
  const [repoName, setRepoName] = useState('');
  const [syncingId, setSyncingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleAddRepo = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await repoService.addRepository(repoUrl, repoName);
      setRepos(repoService.getRepositories());
      setRepoUrl('');
      setRepoName('');
      setSuccessMsg('¡Repositorio añadido con éxito!');
      if (onReposUpdated) onReposUpdated();
    } catch (err) {
      setErrorMsg(err.message || 'Error al añadir el repositorio');
    }
  };

  const handleSync = async (repoId) => {
    setSyncingId(repoId);
    setErrorMsg(null);
    try {
      await repoService.syncRepository(repoId);
      setRepos(repoService.getRepositories());
      setSuccessMsg('Repositorio sincronizado.');
      if (onReposUpdated) onReposUpdated();
    } catch (err) {
      setErrorMsg('Error al sincronizar repositorio');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = (repoId) => {
    if (window.confirm('¿Deseas eliminar este repositorio de extensiones?')) {
      repoService.deleteRepository(repoId);
      setRepos(repoService.getRepositories());
      if (onReposUpdated) onReposUpdated();
    }
  };

  const handleAddPresetKeiyoushi = async () => {
    try {
      await repoService.addRepository('https://raw.githubusercontent.com/keiyoushi/extensions/repo', 'Keiyoushi (Oficial Mihon)');
      setRepos(repoService.getRepositories());
      setSuccessMsg('Repositorio Keiyoushi añadido.');
      if (onReposUpdated) onReposUpdated();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 130,
        background: 'rgba(8, 7, 13, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="fade-in"
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Repositorios de Extensiones
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Añade repositorios externos para descargar fuentes de manga
            </p>
          </div>

          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Feedback Messages */}
          {errorMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: '#fca5a5', fontSize: '13px' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', color: '#6ee7b7', fontSize: '13px' }}>
              <Check size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Active Repositories List */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Repositorios Activos ({repos.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, marginRight: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {repo.name}
                      </h5>
                      {repo.isOfficial && (
                        <span
                          style={{
                            background: 'var(--accent-subtle)',
                            color: 'var(--accent-hover)',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          Oficial
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                      {repo.url}
                    </p>
                    <span style={{ fontSize: '11px', color: 'var(--status-success)', fontWeight: 600 }}>
                      ✓ {repo.extensionsCount || 1443} fuentes disponibles
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleSync(repo.id)}
                      disabled={syncingId === repo.id}
                      className="btn-icon"
                      title="Sincronizar extensiones"
                      style={{ color: 'var(--accent-hover)' }}
                    >
                      <RefreshCw size={17} className={syncingId === repo.id ? 'spin-anim' : ''} />
                    </button>

                    {!repo.isOfficial && (
                      <button
                        onClick={() => handleDelete(repo.id)}
                        className="btn-icon"
                        title="Eliminar repositorio"
                        style={{ color: 'var(--status-danger)' }}
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Repository Form */}
          <form onSubmit={handleAddRepo} style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Añadir Nuevo Repositorio
            </h4>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                URL del Repositorio (index.min.json o enlace de GitHub raw)
              </label>
              <input
                type="url"
                required
                placeholder="https://raw.githubusercontent.com/.../repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Nombre personalizado (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Mi Repositorio de Manga"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '11px', marginTop: '4px' }}
            >
              <Plus size={18} /> Añadir Repositorio
            </button>
          </form>

          {/* Quick preset button if Keiyoushi was deleted */}
          {!repos.some(r => r.id === 'keiyoushi') && (
            <button
              type="button"
              onClick={handleAddPresetKeiyoushi}
              className="btn-secondary"
              style={{ width: '100%', padding: '10px' }}
            >
              <ShieldCheck size={18} color="var(--accent-hover)" /> Restaurar Keiyoushi Oficial
            </button>
          )}
        </div>
      </div>

      <style>{`
        .spin-anim {
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
}
