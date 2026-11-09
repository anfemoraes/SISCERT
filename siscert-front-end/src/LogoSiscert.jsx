import React from 'react';
import logoImg from './assets/logo.png';

export function LogoSiscert({ size = 52, light = false, showText = true, layout = 'row' }) {
  if (layout === 'column') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', userSelect: 'none' }}>
        <img
          src={logoImg}
          alt="SISCERT Logo"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            objectFit: 'contain',
            filter: light ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' : 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))'
          }}
        />
        {showText && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.15 }}>
            <span
              style={{
                fontSize: `${Math.round(size * 0.42)}px`,
                fontWeight: 800,
                letterSpacing: '1.5px',
                color: light ? '#ffffff' : '#0f172a',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            >
              SISCERT
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: light ? '#cbd5e1' : '#64748b',
                marginTop: '4px'
              }}
            >
              CETRAN · PARÁ
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', userSelect: 'none' }}>
      <img
        src={logoImg}
        alt="SISCERT Logo"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          flexShrink: 0,
          filter: light ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' : 'drop-shadow(0 2px 8px rgba(0,0,0,0.06))'
        }}
      />
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span
            style={{
              fontSize: `${Math.max(1.35, size * 0.038)}rem`,
              fontWeight: 800,
              letterSpacing: '1.2px',
              color: light ? '#ffffff' : '#0f172a',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          >
            SISCERT
          </span>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '1.4px',
              textTransform: 'uppercase',
              color: light ? '#cbd5e1' : '#64748b',
              marginTop: '4px'
            }}
          >
            CETRAN · PARÁ
          </span>
        </div>
      )}
    </div>
  );
}
