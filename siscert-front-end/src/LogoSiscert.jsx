import React from 'react';

export function LogoSiscert({ size = 44, light = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', userSelect: 'none' }}>
      <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        <defs>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.18" />
          </filter>
        </defs>
        
        {/* Escudo Base */}
        <path
          d="M28 4L48 10V26C48 38.5 39.5 49 28 52C16.5 49 8 38.5 8 26V10L28 4Z"
          fill="url(#shieldGrad)"
          filter="url(#shadow)"
        />
        
        {/* Borda Dourada Interna */}
        <path
          d="M28 7.5L45 12.6V26C45 36.8 37.8 46 28 48.6C18.2 46 11 36.8 11 26V12.6L28 7.5Z"
          stroke="url(#goldGrad)"
          strokeWidth="1.8"
          strokeOpacity="0.85"
          fill="none"
        />
        
        {/* Faixa Vermelha da Bandeira do Pará estilizada */}
        <path
          d="M13 18L43 34"
          stroke="#ef4444"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeOpacity="0.9"
        />
        
        {/* Estrela de Certificação Oficial */}
        <polygon
          points="28,17 30.5,23 37,23 31.8,27 33.8,33 28,29.5 22.2,33 24.2,27 19,23 25.5,23"
          fill="#ffffff"
          stroke="url(#goldGrad)"
          strokeWidth="0.8"
        />
        
        {/* Marca de verificação / aprovação na base */}
        <path
          d="M23 39L27 42.5L34 35.5"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span
          style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            letterSpacing: '1px',
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
            marginTop: '3px'
          }}
        >
          CETRAN · PARÁ
        </span>
      </div>
    </div>
  );
}
