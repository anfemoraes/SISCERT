import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  ShieldCheck,
  Award,
  CheckCircle2,
  XCircle,
  Download,
  Trash2,
  ArrowLeft,
  LoaderCircle,
  Menu,
  ChevronDown,
  LogOut,
  RefreshCw,
  Eye,
  EyeOff,
  LockKeyhole
} from 'lucide-react';
import { LogoSiscert } from './LogoSiscert';
import './styles.css';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const courses = ['CFAT', 'CFATR', 'CAAT', 'CAATR'];

// Navegação simplificada e focada nos objetivos centrais
const navItems = [
  ['Visão geral', LayoutDashboard],
  ['Emitir certificados', PlusCircle],
  ['Consultar certificados', Search],
  ['Validar autenticidade', ShieldCheck]
];

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  const data = response.status === 204 ? null : await response.json().catch(() => ({ erro: 'Resposta inválida do servidor' }));
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('siscert:unauthorized'));
    throw new Error(data?.erro || `Erro ${response.status}`);
  }
  return data;
}

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [page, setPage] = useState('Visão geral');
  const [mobile, setMobile] = useState(false);
  const [publicMode, setPublicMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    api('/auth/me')
      .then(x => setUser(x.usuario))
      .catch(() => {})
      .finally(() => setChecking(false));

    const onUnauthorized = () => setUser(null);
    window.addEventListener('siscert:unauthorized', onUnauthorized);
    return () => window.removeEventListener('siscert:unauthorized', onUnauthorized);
  }, []);

  // Fechar dropdown do usuário ao clicar fora
  useEffect(() => {
    const handleClickFora = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  async function handleLogout() {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setDropdownOpen(false);
      setPage('Visão geral');
    }
  }

  if (checking) {
    return (
      <div className="center-screen">
        <LoaderCircle className="spin" size={28} />
        <span style={{ fontSize: '15px', fontWeight: 500 }}>Carregando SISCERT…</span>
      </div>
    );
  }

  if (publicMode) {
    return <PublicValidation onBack={() => setPublicMode(false)} onLoginClick={() => setPublicMode(false)} />;
  }

  if (!user) {
    return <Login onSuccess={setUser} onPublic={() => setPublicMode(true)} />;
  }

  const userInitials = (user.nome || user.email || 'AD').slice(0, 2).toUpperCase();

  return (
    <div className="app">
      {/* Sidebar Lateral */}
      <aside className={`sidebar ${mobile ? 'open' : ''}`}>
        <div className="brand" style={{ padding: '4px 8px 24px', borderBottom: '1px solid #f1f5f9', marginBottom: '18px' }}>
          <LogoSiscert size={44} />
        </div>

        <div className="nav-label" style={{ padding: '0 12px 10px', fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
          MENU PRINCIPAL
        </div>

        <nav style={{ display: 'grid', gap: '6px' }}>
          {navItems.map(([name, Icon]) => (
            <button
              key={name}
              className={page === name ? 'selected' : ''}
              onClick={() => {
                setPage(name);
                setMobile(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              <Icon size={19} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        {/* Rodapé da Sidebar */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '11px 14px',
              background: 'transparent',
              border: 'none',
              borderRadius: '10px',
              color: '#ef4444',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={18} />
            <span>Sair do sistema</span>
          </button>
          
          <div style={{ marginTop: '14px', padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', fontSize: '11px', color: '#64748b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#334155' }}>
              <ShieldCheck size={14} color="#16a34a" /> SISCERT Oficial
            </div>
            <div style={{ marginTop: '3px' }}>Resolução 004/2025 · CETRAN/PA</div>
          </div>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="main">
        {/* Topbar com div de usuário igual ao Radar 2030 */}
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobile(!mobile)}>
            <Menu size={22} />
          </button>
          
          <div className="crumb" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <b style={{ color: '#1e3a8a', fontSize: '13px' }}>SISCERT</b>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ color: '#475569', fontWeight: 600 }}>{page}</span>
          </div>

          {/* Div do usuário no canto superior direito (Estilo Radar 2030) */}
          <div className="top-actions" ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="Menu do usuário"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                background: dropdownOpen ? '#f1f5f9' : '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '999px',
                padding: '0.28rem 0.75rem 0.28rem 0.32rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              {/* Avatar circular com gradiente do Radar 2030 */}
              <span
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  flexShrink: 0
                }}
              >
                {userInitials}
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                  {user.nome ? user.nome.split(' ')[0] : 'Admin'}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                  {user.perfil || 'Administrador'}
                </span>
              </div>

              {/* Ícone de seta com rotação */}
              <ChevronDown
                size={14}
                style={{
                  color: '#64748b',
                  transition: 'transform 0.2s ease',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  marginLeft: '2px'
                }}
              />
            </button>

            {/* Dropdown Menu Flutuante */}
            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: '250px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  padding: '0.5rem',
                  zIndex: 1001,
                  animation: 'fadeIn 0.15s ease'
                }}
              >
                {/* Cabeçalho do usuário no dropdown */}
                <div style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        flexShrink: 0
                      }}
                    >
                      {userInitials}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25, overflow: 'hidden' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.nome || 'Administrador SISCERT'}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações do Dropdown */}
                <button
                  type="button"
                  onClick={() => {
                    setPage('Validar autenticidade');
                    setDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#334155',
                    fontSize: '0.86rem',
                    fontWeight: 500,
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <ShieldCheck size={16} color="#2563eb" />
                  <span>Validar certificado por código</span>
                </button>

                <div style={{ height: '1px', background: '#f1f5f9', margin: '0.35rem 0' }} />

                {/* Botão Sair */}
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#e11d48',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fff1f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={16} />
                  <span>Sair do sistema</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Conteúdo Central */}
        <section className="content">
          {page === 'Visão geral' && <Dashboard user={user} go={setPage} />}
          {page === 'Emitir certificados' && <NewAta onDone={() => setPage('Consultar certificados')} />}
          {page === 'Consultar certificados' && <Records />}
          {page === 'Validar autenticidade' && <PublicValidation embedded onBack={() => setPage('Visão geral')} />}
        </section>
      </main>
    </div>
  );
}

// -------------------------------------------------------------
// TELA DE LOGIN
// -------------------------------------------------------------
function Login({ onSuccess, onPublic }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const x = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha })
      });
      onSuccess(x.usuario);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-art">
        <div style={{ marginBottom: 'auto' }}>
          <LogoSiscert size={56} light />
        </div>

        <div className="art-copy">
          <span className="eyebrow" style={{ color: '#93c5fd', letterSpacing: '2px', fontWeight: 800 }}>
            CETRAN · GOVERNO DO PARÁ
          </span>
          <h1 style={{ fontSize: '38px', lineHeight: 1.18, marginTop: '14px', marginBottom: '16px' }}>
            Emissão & Consulta de Certificações.
          </h1>
          <p style={{ color: '#e2e8f0', fontSize: '15px', lineHeight: 1.6, maxWidth: '440px' }}>
            Sistema oficial de homologação, registro e autenticação de cursos de trânsito (Resolução 004/2025-CETRAN/PA).
          </p>
        </div>

        <div className="art-foot" style={{ color: '#cbd5e1', fontSize: '12px', marginTop: 'auto' }}>
          Conselho Estadual de Trânsito do Estado do Pará
        </div>
      </div>

      <div className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div style={{ marginBottom: '22px' }}>
            <LogoSiscert size={48} />
          </div>

          <h2 style={{ fontSize: '24px', margin: '0 0 6px 0', color: '#0f172a' }}>Acesso Restrito</h2>
          <p className="muted" style={{ margin: '0 0 22px 0', fontSize: '13px' }}>
            Entre com suas credenciais do SISCERT.
          </p>

          <label className="field-label">E-mail institucional</label>
          <input
            className="input"
            type="email"
            autoComplete="username"
            placeholder="admin@cetran.pa.gov.br"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label className="field-label">Senha</label>
          <div className="password-wrap">
            <input
              className="input"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
            <button type="button" className="reveal" onClick={() => setShow(!show)}>
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <div className="alert error">{error}</div>}

          <button className="primary full" disabled={busy} style={{ marginTop: '20px', padding: '13px' }}>
            {busy ? (
              <>
                <LoaderCircle className="spin" size={18} /> Entrando…
              </>
            ) : (
              'Entrar no sistema'
            )}
          </button>

          <button
            type="button"
            className="public-link"
            onClick={onPublic}
            style={{
              marginTop: '16px',
              padding: '10px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              color: '#2563eb',
              background: '#f8fafc',
              fontSize: '13px'
            }}
          >
            <ShieldCheck size={17} /> Conferir certificado por código (Consulta Pública)
          </button>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// VISÃO GERAL (DASHBOARD LIMPO E DIRETO)
// -------------------------------------------------------------
function Dashboard({ user, go }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api('/admin/resumo')
      .then(setSummary)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const nomeExibicao = user?.nome ? user.nome.split(' ')[0] : 'Administrador';

  return (
    <>
      {/* Banner de Boas-Vindas personalizado */}
      <div className="welcome" style={{ padding: '28px 32px' }}>
        <div>
          <p className="date" style={{ color: '#2563eb', letterSpacing: '1.5px', marginBottom: '8px', fontWeight: 700 }}>
            SISTEMA OFICIAL DE CERTIFICAÇÃO
          </p>
          <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', color: '#0f172a' }}>
            Bem-vindo, {nomeExibicao}!
          </h1>
          <p className="subtitle" style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            Gerencie emissões de certificações de cursos de trânsito e confira a autenticidade dos registros.
          </p>
        </div>

        {/* Botões de Ação Imediata */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="primary" onClick={() => go('Emitir certificados')} style={{ padding: '12px 18px', fontSize: '13.5px' }}>
            <PlusCircle size={18} /> Emitir certificados
          </button>
          <button className="secondary" onClick={() => go('Validar autenticidade')} style={{ padding: '12px 16px', fontSize: '13.5px' }}>
            <ShieldCheck size={18} color="#2563eb" /> Validar código
          </button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {/* Cards de Métricas Diretas */}
      <div className="stats" style={{ margin: '22px 0' }}>
        <div className="stat">
          <div className="stat-icon blue">
            <Award size={24} />
          </div>
          <div>
            <p>Total de Registros</p>
            <strong>{summary?.total ?? '0'}</strong>
            <small>Atas processadas</small>
          </div>
        </div>

        <div className="stat">
          <div className="stat-icon green">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p>Agentes Aprovados</p>
            <strong>{summary?.aprovados ?? '0'}</strong>
            <small style={{ color: '#16a34a' }}>Com código gerado</small>
          </div>
        </div>

        <div className="stat">
          <div className="stat-icon purple">
            <XCircle size={24} />
          </div>
          <div>
            <p>Reprovados</p>
            <strong>{summary?.reprovados ?? '0'}</strong>
            <small style={{ color: '#64748b' }}>Sem emissão de código</small>
          </div>
        </div>
      </div>

      {/* Registros Recentes */}
      <section className="panel recent-panel" style={{ marginTop: '22px' }}>
        <div className="panel-heading">
          <div>
            <h2 style={{ fontSize: '17px', margin: 0, color: '#0f172a' }}>Últimas Certificações Emitidas</h2>
            <p className="muted" style={{ marginTop: '4px' }}>Concluintes cadastrados recentemente no sistema</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="secondary" onClick={load} title="Atualizar">
              <RefreshCw size={15} /> Atualizar
            </button>
            <button className="text-button" onClick={() => go('Consultar certificados')} style={{ cursor: 'pointer', fontSize: '13.5px' }}>
              Ver todos os registros →
            </button>
          </div>
        </div>

        {!summary?.recentes?.length ? (
          <Empty text="Nenhum registro encontrado ainda. Clique em 'Emitir certificados' para cadastrar a primeira ata." />
        ) : (
          <div style={{ marginTop: '12px' }}>
            {summary.recentes.map((r, i) => (
              <div className="row" key={`${r.codigo}-${i}`}>
                <div className="row-icon">
                  <Award size={18} />
                </div>
                <div className="row-main">
                  <b>{r.nome}</b>
                  <small>
                    <b>{r.codigo || 'Sem código'}</b> · {r.curso} · {r.municipio}
                  </small>
                </div>
                <span className={`badge ${r.resultado === 'APROVADO' ? '' : 'bad'}`}>{r.resultado}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// -------------------------------------------------------------
// CONSULTAR REGISTROS (PESQUISA DIRETA)
// -------------------------------------------------------------
function Records() {
  const [filters, setFilters] = useState({ nome: '', cpf: '', municipio: '', curso: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pagina, setPagina] = useState(1);

  async function search(e, pageNumber = 1) {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v.trim()) params.set(k, v.trim());
    });
    params.set('pagina', String(pageNumber));
    params.set('tamanho', '20');

    if (!params.has('nome') && !params.has('cpf') && !params.has('municipio') && !params.has('curso')) {
      setError('Informe ao menos um critério para pesquisar (Nome, CPF ou Município).');
      return;
    }

    setBusy(true);
    setError('');
    try {
      setResult(await api(`/certificacoes?${params}`));
      setPagina(pageNumber);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function change(k, v) {
    setFilters(x => ({ ...x, [k]: v }));
  }

  function exportCsv() {
    if (!result?.itens?.length) return;
    const rows = [
      ['Código', 'Nome', 'CPF', 'Curso', 'Município', 'Início', 'Término', 'Resultado'],
      ...result.itens.map(x => [x.codigo, x.nome, x.cpf, x.curso, x.municipio, x.periodoInicio, x.periodoFim, x.resultado])
    ];
    const blob = new Blob(['\ufeff' + rows.map(r => r.map(v => `"${String(v ?? '').replaceAll('"', '""')}"`).join(';')).join('\n')], {
      type: 'text/csv;charset=utf-8'
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'siscert-certificacoes.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="date">SISCERT · CONSULTA</p>
          <h1>Consultar Certificados</h1>
          <p className="subtitle">Pesquise agentes cadastrados por Nome, CPF ou Município.</p>
        </div>
      </div>

      <form className="filter-card" onSubmit={search}>
        <div className="filters">
          <label>
            Nome do concluinte
            <input className="input" value={filters.nome} onChange={e => change('nome', e.target.value)} placeholder="Ex.: Maria da Silva" />
          </label>
          <label>
            CPF
            <input className="input" value={filters.cpf} onChange={e => change('cpf', e.target.value)} placeholder="Somente números" />
          </label>
          <label>
            Município
            <input className="input" value={filters.municipio} onChange={e => change('municipio', e.target.value)} placeholder="Ex.: Belém" />
          </label>
          <label>
            Curso
            <select className="input" value={filters.curso} onChange={e => change('curso', e.target.value)}>
              <option value="">Todos os cursos</option>
              {courses.map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>

        {error && <div className="alert error">{error}</div>}

        <div className="filter-actions" style={{ marginTop: '16px' }}>
          <button className="primary" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={17} /> : <Search size={17} />} Pesquisar
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setFilters({ nome: '', cpf: '', municipio: '', curso: '' });
              setResult(null);
              setError('');
              setPagina(1);
            }}
          >
            Limpar filtros
          </button>
        </div>
      </form>

      <section className="panel results-panel" style={{ marginTop: '22px' }}>
        <div className="panel-heading">
          <div>
            <h2>Resultados</h2>
            <p className="muted">
              {result ? `${result.total} registro(s) encontrado(s)` : 'Informe os filtros acima para pesquisar.'}
            </p>
          </div>
          {result?.itens?.length > 0 && (
            <button className="secondary" onClick={exportCsv}>
              <Download size={16} /> Exportar CSV
            </button>
          )}
        </div>

        {!result ? (
          <Empty text="Os registros encontrados na pesquisa aparecerão aqui." />
        ) : !result.itens.length ? (
          <Empty text="Nenhum certificado encontrado para os critérios pesquisados." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Concluinte</th>
                  <th>Curso</th>
                  <th>Município</th>
                  <th>Período</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {result.itens.map((r, i) => (
                  <tr key={`${r.codigo}-${i}`}>
                    <td className="code" style={{ fontSize: '13px' }}>
                      {r.codigo || '—'}
                    </td>
                    <td>
                      <b>{r.nome}</b>
                      <small>{r.cpf}</small>
                    </td>
                    <td>{r.curso}</td>
                    <td>{r.municipio}</td>
                    <td>
                      {formatDate(r.periodoInicio)} – {formatDate(r.periodoFim)}
                    </td>
                    <td>
                      <span className={`badge ${r.resultado === 'APROVADO' ? '' : 'bad'}`}>{r.resultado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result && result.total > 20 && (
          <div className="pagination">
            <span>
              Página {pagina} de {Math.ceil(result.total / 20)} · Total de {result.total} registros
            </span>
            <div>
              <button className="secondary" disabled={pagina <= 1 || busy} onClick={() => search(undefined, pagina - 1)}>
                Anterior
              </button>
              <button
                className="secondary"
                disabled={pagina >= Math.ceil(result.total / 20) || busy}
                onClick={() => search(undefined, pagina + 1)}
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

// -------------------------------------------------------------
// EMITIR CERTIFICADOS (CADASTRO DE ATA)
// -------------------------------------------------------------
function NewAta({ onDone }) {
  const [ata, setAta] = useState({
    curso: 'CFAT',
    municipio: '',
    periodoInicio: '',
    periodoFim: '',
    concluintes: [blankPerson()]
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  function updateAta(k, v) {
    setAta(x => ({ ...x, [k]: v }));
  }

  function updatePerson(i, k, v) {
    setAta(x => ({
      ...x,
      concluintes: x.concluintes.map((p, n) => (n === i ? { ...p, [k]: v } : p))
    }));
  }

  function addPerson() {
    if (ata.concluintes.length < 50) {
      setAta(x => ({ ...x, concluintes: [...x.concluintes, blankPerson()] }));
    }
  }

  function removePerson(i) {
    setAta(x => ({
      ...x,
      concluintes: x.concluintes.filter((_, n) => n !== i)
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess(null);

    const payload = {
      ...ata,
      concluintes: ata.concluintes.map(p => ({
        ...p,
        frequencia: Number(p.frequencia),
        notaAd: p.notaAd === '' ? undefined : Number(p.notaAd),
        notaOd: p.notaOd === '' ? undefined : Number(p.notaOd),
        notaAf: p.notaAf === '' ? undefined : Number(p.notaAf),
        mediaFinal: p.mediaFinal === '' ? undefined : Number(p.mediaFinal)
      }))
    };

    try {
      const rows = await api('/atas', { method: 'POST', body: JSON.stringify(payload) });
      setSuccess(rows);
      setAta({
        curso: 'CFAT',
        municipio: '',
        periodoInicio: '',
        periodoFim: '',
        concluintes: [blankPerson()]
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const hasGrades = ['CFAT', 'CFATR'].includes(ata.curso);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="date">SISCERT · EMISSÃO</p>
          <h1>Emitir Certificados (Nova Ata)</h1>
          <p className="subtitle">
            Cadastre os concluintes da turma. O sistema valida os CPFs e gera os códigos sequenciais oficiais na hora.
          </p>
        </div>
      </div>

      <form onSubmit={submit}>
        <section className="panel form-panel">
          <h2>1. Dados do Curso e Município</h2>
          <div className="form-grid">
            <label>
              Curso homologado
              <select className="input" value={ata.curso} onChange={e => updateAta('curso', e.target.value)}>
                {courses.map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Município
              <input
                className="input"
                required
                minLength={2}
                maxLength={120}
                value={ata.municipio}
                onChange={e => updateAta('municipio', e.target.value)}
                placeholder="Ex.: Belém, Santarém, Marabá..."
              />
            </label>
            <label>
              Data de Início
              <input className="input" type="date" required value={ata.periodoInicio} onChange={e => updateAta('periodoInicio', e.target.value)} />
            </label>
            <label>
              Data de Conclusão
              <input className="input" type="date" required value={ata.periodoFim} onChange={e => updateAta('periodoFim', e.target.value)} />
            </label>
          </div>
        </section>

        <section className="panel form-panel" style={{ marginTop: '20px' }}>
          <div className="panel-heading">
            <div>
              <h2>2. Agentes Concluintes</h2>
              <p className="muted">Até 50 concluintes por ata. O código oficial será gerado para cada aprovado.</p>
            </div>
            <button type="button" className="secondary" onClick={addPerson} disabled={ata.concluintes.length >= 50}>
              <PlusCircle size={16} /> Adicionar concluinte ({ata.concluintes.length}/50)
            </button>
          </div>

          {ata.concluintes.map((p, i) => (
            <div className="person-card" key={i}>
              <div className="person-title">
                <b>Concluinte {i + 1}</b>
                {ata.concluintes.length > 1 && (
                  <button type="button" className="icon-button danger" onClick={() => removePerson(i)} title="Remover concluinte">
                    <Trash2 size={17} />
                  </button>
                )}
              </div>

              <div className="form-grid">
                <label>
                  Nome completo
                  <input
                    className="input"
                    required
                    minLength={3}
                    maxLength={200}
                    value={p.nome}
                    onChange={e => updatePerson(i, 'nome', e.target.value)}
                    placeholder="Nome completo do agente"
                  />
                </label>

                <label>
                  CPF
                  <input
                    className="input"
                    required
                    inputMode="numeric"
                    maxLength={14}
                    placeholder="000.000.000-00"
                    value={p.cpf}
                    onChange={e => updatePerson(i, 'cpf', e.target.value)}
                  />
                </label>

                <label>
                  Cargo ou Função
                  <input
                    className="input"
                    required
                    minLength={2}
                    maxLength={120}
                    value={p.cargoFuncao}
                    onChange={e => updatePerson(i, 'cargoFuncao', e.target.value)}
                    placeholder="Ex.: Agente de Trânsito"
                  />
                </label>

                <label>
                  Frequência (%)
                  <input
                    className="input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    value={p.frequencia}
                    onChange={e => updatePerson(i, 'frequencia', e.target.value)}
                  />
                </label>

                {hasGrades &&
                  ['notaAd', 'notaOd', 'notaAf', 'mediaFinal'].map(k => (
                    <label key={k}>
                      {{ notaAd: 'Nota AD', notaOd: 'Nota OD', notaAf: 'Nota AF', mediaFinal: 'Média final' }[k]}
                      <input
                        className="input"
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        required
                        value={p[k]}
                        onChange={e => updatePerson(i, k, e.target.value)}
                      />
                    </label>
                  ))}

                <label>
                  Resultado final
                  <select className="input" value={p.resultado} onChange={e => updatePerson(i, 'resultado', e.target.value)}>
                    <option value="APROVADO">APROVADO (Recebe código)</option>
                    <option value="REPROVADO">REPROVADO</option>
                  </select>
                </label>

                <label className="wide">
                  Observações (opcional)
                  <textarea
                    className="input"
                    rows="2"
                    maxLength={500}
                    value={p.observacoes}
                    onChange={e => updatePerson(i, 'observacoes', e.target.value)}
                    placeholder="Informações complementares sobre a homologação..."
                  />
                </label>
              </div>
            </div>
          ))}
        </section>

        {error && <div className="alert error">{error}</div>}

        {success && (
          <div className="alert success" style={{ padding: '16px 20px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px' }}>
              <CheckCircle2 size={20} /> Ata registrada com sucesso!
            </div>
            <div style={{ marginTop: '6px', fontSize: '13px' }}>
              Foram processados {success.length} agente(s) e gerados <b>{success.filter(x => x.codigo).length} código(s) oficiais</b>.
            </div>
            <div className="generated-codes" style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {success
                .filter(x => x.codigo)
                .map(x => (
                  <span
                    key={x.codigo}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #bbf7d0',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  >
                    {x.nome}: <strong style={{ color: '#15803d' }}>{x.codigo}</strong>
                  </span>
                ))}
            </div>
          </div>
        )}

        <div className="submit-row" style={{ marginTop: '22px' }}>
          <button type="submit" className="primary" disabled={busy}>
            {busy ? (
              <>
                <LoaderCircle className="spin" size={18} /> Processando ata…
              </>
            ) : (
              <>
                <CheckCircle2 size={18} /> Salvar ata e gerar códigos
              </>
            )}
          </button>

          {success && (
            <button type="button" className="secondary" onClick={onDone}>
              Ir para lista de certificados →
            </button>
          )}
        </div>
      </form>
    </>
  );
}

function blankPerson() {
  return {
    nome: '',
    cpf: '',
    cargoFuncao: '',
    frequencia: '100',
    notaAd: '',
    notaOd: '',
    notaAf: '',
    mediaFinal: '',
    resultado: 'APROVADO',
    observacoes: ''
  };
}

// -------------------------------------------------------------
// VALIDAÇÃO PÚBLICA / CONSULTA POR CÓDIGO
// -------------------------------------------------------------
function PublicValidation({ onBack, embedded = false, onLoginClick }) {
  const [codigo, setCodigo] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function verify(e) {
    e.preventDefault();
    setBusy(true);
    setData(null);
    setError('');
    try {
      setData(await api(`/certificacoes/${encodeURIComponent(codigo.trim().toUpperCase())}`));
    } catch (err) {
      setError(err.message || 'Certificado não localizado para este código.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={embedded ? 'public-page' : 'public-screen'}>
      {!embedded && (
        <div className="public-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
          <LogoSiscert size={48} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="button"
              onClick={onLoginClick || onBack}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                padding: '0.55rem 1.35rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
              }}
            >
              <LockKeyhole size={15} /> Entrar no sistema
            </button>
          </div>
        </div>
      )}

      <div className="public-card" style={{ maxWidth: '620px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 14px'
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', color: '#2563eb' }}>
            CONSULTA PÚBLICA DE AUTENTICIDADE
          </span>
          <h2 style={{ fontSize: '24px', margin: '8px 0 6px', color: '#0f172a' }}>Validação de Certificado</h2>
          <p className="muted" style={{ fontSize: '13.5px', margin: 0 }}>
            Digite o código oficial do certificado para conferir a veracidade na base do CETRAN/PA.
          </p>
        </div>

        <form onSubmit={verify} className="verify-form">
          <label className="field-label" style={{ fontWeight: 600, color: '#334155' }}>
            Código do certificado
          </label>
          <input
            className="input code-input"
            placeholder="Ex.: CFAT2026.0001 ou CAAT2025.0001"
            value={codigo}
            onChange={e => setCodigo(e.target.value.toUpperCase())}
            required
            style={{ fontSize: '15px', letterSpacing: '1px', textAlign: 'center', padding: '14px' }}
          />

          <button className="primary full" disabled={busy} style={{ marginTop: '16px', padding: '14px' }}>
            {busy ? <LoaderCircle className="spin" size={18} /> : <Search size={18} />} Conferir Autenticidade
          </button>
        </form>

        {error && <div className="alert error">{error}</div>}

        {data && (
          <div className="verification-result" style={{ marginTop: '22px' }}>
            <div
              className="verified"
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <CheckCircle2 size={26} color="#16a34a" />
              <div>
                <b style={{ color: '#15803d', fontSize: '15px' }}>Certificado Autêntico e Válido</b>
                <span style={{ display: 'block', color: '#4b5563', fontSize: '12px', marginTop: '2px' }}>
                  Registro localizado na base oficial de certificações do CETRAN/PA.
                </span>
              </div>
            </div>

            <div className="detail-grid" style={{ marginTop: '16px' }}>
              <Detail label="Código Oficial" value={data.codigo} highlight />
              <Detail label="Nome do Concluinte" value={data.nome} />
              <Detail label="Curso Homologado" value={data.curso} />
              <Detail label="Município" value={data.municipio} />
              <Detail label="Período de Realização" value={`${formatDate(data.periodoInicio)} a ${formatDate(data.periodoFim)}`} />
              <Detail label="Resultado" value={data.resultado} />
            </div>
          </div>
        )}
      </div>

      {!embedded && (
        <p className="public-footer" style={{ textAlign: 'center', marginTop: '28px', color: '#64748b', fontSize: '12px' }}>
          SISCERT · Conselho Estadual de Trânsito do Pará (CETRAN/PA)
        </p>
      )}
    </div>
  );
}

function Detail({ label, value, highlight = false }) {
  return (
    <div className="detail" style={{ background: highlight ? '#eff6ff' : '#f8fafc', border: highlight ? '1px solid #bfdbfe' : '1px solid #f1f5f9' }}>
      <small style={{ color: highlight ? '#1d4ed8' : '#64748b' }}>{label}</small>
      <b style={{ color: highlight ? '#1e3a8a' : '#0f172a', fontSize: highlight ? '14px' : '13px' }}>{value || '—'}</b>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="empty">
      <Award size={32} color="#94a3b8" />
      <span>{text}</span>
    </div>
  );
}

function formatDate(v) {
  if (!v) return '—';
  const [y, m, d] = v.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

createRoot(document.getElementById('root')).render(<App />);
