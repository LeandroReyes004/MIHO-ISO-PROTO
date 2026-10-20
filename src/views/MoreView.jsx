import React, { useState, useRef } from 'react';
import { 
  Settings, 
  BookOpen, 
  Download, 
  Upload, 
  Smartphone, 
  Info, 
  ExternalLink, 
  Check, 
  ShieldCheck, 
  Palette,
  Moon,
  Sparkles,
  Share,
  Server
} from 'lucide-react';
import { storage } from '../services/storage';
import RepoManagerModal from '../components/RepoManagerModal';

export default function MoreView({ settings, onUpdateSettings, isSimulator, onToggleSimulator, onReloadData }) {
  const [importStatus, setImportStatus] = useState(null);
  const [isRepoModalOpen, setIsRepoModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleExportBackup = () => {
    storage.exportBackup();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const result = storage.importBackup(content);
        if (result.success) {
          setImportStatus(`¡Copia de seguridad restaurada! ${result.count} mangas importados.`);
          if (onReloadData) onReloadData();
        } else {
          setImportStatus(`Error al importar: ${result.error}`);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ padding: '16px 16px calc(var(--nav-height) + var(--sab) + 40px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Mihon Hero Banner Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(157, 92, 245, 0.2) 0%, rgba(126, 58, 242, 0.1) 100%)',
          border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-subtle)',
            flexShrink: 0,
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <img src="/icon.svg" alt="Mihon Logo" style={{ width: '42px', height: '42px' }} />
        </div>

        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Mihon para iOS
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--accent-hover)', fontWeight: 600 }}>
            v1.0.0 • Progressive Web App
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Adaptación nativa y optimizada para Safari y pantalla de inicio de iPhone.
          </p>
        </div>
      </div>

      {/* Extension Repositories Section */}
      <div>
        <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
          Extensiones y Fuentes
        </h3>

        <div className="ios-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            onClick={() => setIsRepoModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Server size={20} color="var(--accent-hover)" />
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Repositorios de extensiones</span>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Añade o sincroniza repositorios externos (Keiyoushi)</p>
              </div>
            </div>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Gestionar
            </button>
          </div>
        </div>
      </div>

      {/* Reader Settings Section */}
      <div>
        <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
          Configuración del Lector
        </h3>
        
        <div className="ios-card" style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Default Reading Mode */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Modo de lectura predeterminado</span>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Orientación al abrir cualquier capítulo</p>
            </div>
            
            <select
              value={settings.readingMode}
              onChange={(e) => onUpdateSettings({ ...settings, readingMode: e.target.value })}
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="webtoon">Webtoon (Cascada vertical)</option>
              <option value="rtl">Manga (Derecha a Izquierda)</option>
              <option value="ltr">Cómic (Izquierda a Derecha)</option>
            </select>
          </div>

          {/* Color Theme */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Fondo de lectura</span>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Optimizado para pantallas OLED de iPhone</p>
            </div>
            
            <select
              value={settings.theme}
              onChange={(e) => onUpdateSettings({ ...settings, theme: e.target.value })}
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="oled">Negro Puro OLED (#000000)</option>
              <option value="dark">Gris Oscuro (#121217)</option>
              <option value="sepia">Sepia Nocturno Caliente</option>
            </select>
          </div>

          {/* Invert Tap Zones */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Invertir zonas de toque</span>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Cambia la dirección para avanzar páginas</p>
            </div>
            
            <input
              type="checkbox"
              checked={settings.invertTapZones}
              onChange={(e) => onUpdateSettings({ ...settings, invertTapZones: e.target.checked })}
              style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>

      {/* Backup & Restore Section */}
      <div>
        <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
          Copias de Seguridad (Backup)
        </h3>

        <div className="ios-card" style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Export */}
          <div
            onClick={handleExportBackup}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Download size={20} color="var(--accent-hover)" />
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Crear copia de seguridad</span>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Descargar archivo JSON compatible con Mihon</p>
              </div>
            </div>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Exportar
            </button>
          </div>

          {/* Import */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              cursor: 'pointer',
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json"
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Upload size={20} color="var(--accent-hover)" />
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Restaurar copia de seguridad</span>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Importa mangas, categorías e historial</p>
              </div>
            </div>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Importar
            </button>
          </div>
        </div>

        {importStatus && (
          <p style={{ fontSize: '12px', color: 'var(--status-success)', marginTop: '8px', padding: '0 8px' }}>
            {importStatus}
          </p>
        )}
      </div>

      {/* iOS Installation Guide */}
      <div
        className="ios-card"
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: 'rgba(23, 20, 36, 0.7)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Share size={18} color="var(--accent-hover)" />
          <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Cómo instalar en iPhone (Safari)</h4>
        </div>
        <ol style={{ paddingLeft: '20px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <li>Abre este enlace en el navegador <strong>Safari</strong> de tu iPhone.</li>
          <li>Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba).</li>
          <li>Desplázate hacia abajo y selecciona <strong>"Añadir a pantalla de inicio"</strong>.</li>
          <li>¡Listo! Mihon se abrirá a pantalla completa como una app nativa de iOS.</li>
        </ol>
      </div>

      {/* Simulator Frame Toggle */}
      <div className="ios-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Smartphone size={20} color="var(--accent-hover)" />
          <div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Simulador Marco iPhone 16</span>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Prueba la experiencia de pantalla móvil en tu monitor</p>
          </div>
        </div>
        
        <input
          type="checkbox"
          checked={isSimulator}
          onChange={onToggleSimulator}
          style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
        />
      </div>

      {/* About & Source Code */}
      <div className="ios-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={18} color="var(--accent-hover)" />
          <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Acerca de Mihon</h4>
        </div>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Mihon es la continuación espiritual del proyecto Tachiyomi. Esta versión adapta su motor y experiencia para usuarios de iPhone y iPad con soporte completo para extensiones y mangas en español.
        </p>
        <a
          href="https://github.com/mihonapp/mihon"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            color: 'var(--accent-hover)',
            textDecoration: 'none',
            fontWeight: 600,
            marginTop: '4px',
          }}
        >
          Ver repositorio oficial en GitHub <ExternalLink size={14} />
        </a>
      </div>

      {/* Extension Repositories Manager Modal */}
      <RepoManagerModal
        isOpen={isRepoModalOpen}
        onClose={() => setIsRepoModalOpen(false)}
      />
    </div>
  );
}
