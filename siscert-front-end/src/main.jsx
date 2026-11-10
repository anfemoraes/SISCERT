import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  ShieldCheck,
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
  LockKeyhole,
  Pencil,
  Mail,
  AlertTriangle,
  X
} from 'lucide-react';
import { LogoSiscert } from './LogoSiscert';
import emptyCertificatesImage from './assets/illustrations/empty-certificates.png';
import emptySearchResultsImage from './assets/illustrations/empty-search-results.png';
import './styles.css';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const courses = ['CFAT', 'CFATR', 'CAAT', 'CAATR'];
const DashboardCharts = lazy(() => import('./DashboardCharts'));

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
  const userMenuButtonRef = useRef(null);

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
        <LoaderCircle className="spin" size={28} aria-hidden="true" />
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
      <header className="app-header">
        <button
          type="button"
          className="mobile-menu"
          onClick={() => setMobile(!mobile)}
          aria-label={mobile ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobile}
          aria-controls="primary-navigation"
        >
          <Menu size={22} aria-hidden="true" />
        </button>

        <div className="app-header-brand">
          <LogoSiscert size={38} showCetran />
        </div>

        <div
          className="top-actions"
          ref={dropdownRef}
          onKeyDown={event => {
            if (event.key === 'Escape' && dropdownOpen) {
              setDropdownOpen(false);
              userMenuButtonRef.current?.focus();
            }
          }}
        >
          <button
            ref={userMenuButtonRef}
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label="Menu do usuário"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-controls="user-dropdown"
            className={`user-menu-trigger${dropdownOpen ? ' is-open' : ''}`}
          >
            <span className="user-avatar">{userInitials}</span>
            <div className="user-menu-copy">
              <span>{user.nome ? user.nome.split(' ')[0] : 'Admin'}</span>
              <small>{user.perfil || 'Administrador'}</small>
            </div>
            <ChevronDown className="user-menu-chevron" size={16} aria-hidden="true" />
          </button>

          {dropdownOpen && (
            <div id="user-dropdown" className="user-dropdown">
              <div className="user-dropdown-header">
                <div className="user-dropdown-person">
                  <span className="user-avatar user-avatar-large">{userInitials}</span>
                  <div className="user-dropdown-copy">
                    <span>{user.nome || 'Administrador SISCERT'}</span>
                    <small>{user.email}</small>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPage('Validar autenticidade');
                  setDropdownOpen(false);
                }}
                className="user-dropdown-action"
              >
                <ShieldCheck size={16} aria-hidden="true" />
                <span>Validar certificado por código</span>
              </button>

              <div className="user-dropdown-divider" />

              <button type="button" onClick={handleLogout} className="user-dropdown-action logout">
                <LogOut size={16} aria-hidden="true" />
                <span>Sair do sistema</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="app-layout">
        <aside id="primary-navigation" className={`sidebar ${mobile ? 'open' : ''}`} aria-label="Navegação principal">
          <div className="nav-label">MENU PRINCIPAL</div>

          <nav aria-label="Menu principal">
            {navItems.map(([name, Icon]) => (
              <button
                key={name}
                className={page === name ? 'selected' : ''}
                type="button"
                aria-current={page === name ? 'page' : undefined}
                onClick={() => {
                  setPage(name);
                  setMobile(false);
                }}
              >
                <Icon size={19} aria-hidden="true" />
                <span>{name}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button type="button" className="sidebar-logout" onClick={handleLogout}>
              <LogOut size={18} aria-hidden="true" />
              <span>Sair do sistema</span>
            </button>

          </div>
        </aside>

        <main className="main">
          <section className="content">
            <nav className="breadcrumb" aria-label="Você está em">
              <button type="button" onClick={() => setPage('Visão geral')}>Início</button>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{page}</span>
            </nav>
            {page === 'Visão geral' && <Dashboard user={user} go={setPage} />}
            {page === 'Emitir certificados' && <NewAta onDone={() => setPage('Consultar certificados')} />}
            {page === 'Consultar certificados' && <Records />}
            {page === 'Validar autenticidade' && <PublicValidation embedded onBack={() => setPage('Visão geral')} />}
          </section>

          <footer className="app-footer">
            <span>SISCERT · CETRAN/PA</span>
            <span>Conselho Estadual de Trânsito do Pará · Resolução 004/2025</span>
          </footer>
        </main>
      </div>
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
          <LogoSiscert size={56} light showCetran />
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

          <label className="field-label login-email-label" htmlFor="login-email"><Mail size={16} aria-hidden="true" /> E-mail institucional <span className="required-mark" aria-hidden="true">*</span></label>
          <input
            id="login-email"
            className="input"
            type="email"
            autoComplete="username"
            placeholder="admin@cetran.pa.gov.br"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label className="field-label" htmlFor="login-password">Senha <span className="required-mark" aria-hidden="true">*</span></label>
          <div className="password-wrap">
            <input
              id="login-password"
              className="input"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
            <button
              type="button"
              className="reveal"
              onClick={() => setShow(!show)}
              aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={show}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <div className="alert error">{error}</div>}

          <button className="primary full" disabled={busy} style={{ marginTop: '20px', padding: '13px' }}>
            {busy ? (
              <>
                <LoaderCircle className="spin" size={18} aria-hidden="true" /> Entrando…
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
  const [summaryView, setSummaryView] = useState('cards');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingCert, setEditingCert] = useState(null);
  const [deletingCert, setDeletingCert] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

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

  async function handleEditRecente(r) {
    try {
      const full = await api(`/certificacoes/detalhes/${r.id}`);
      setEditingCert(full);
    } catch (err) {
      setError(err.message || 'Erro ao carregar detalhes do certificado');
    }
  }

  const nomeExibicao = user?.nome ? user.nome.split(' ')[0] : 'Administrador';
  return (
    <>
      <section className="dashboard-welcome">
        <div className="dashboard-welcome-copy">
          <p className="dashboard-eyebrow">SISCERT · CETRAN/PA</p>
          <h1>Bem-vindo, {nomeExibicao}!</h1>
          <p>Gerencie as certificações e acompanhe os registros do sistema em um só lugar.</p>
        </div>
        <div className="dashboard-actions">
          <button className="primary" onClick={() => go('Emitir certificados')}>
            <PlusCircle size={18} /> Emitir certificados
          </button>
          <button className="secondary" onClick={() => go('Validar autenticidade')}>
            <ShieldCheck size={18} color="#2563eb" /> Validar código
          </button>
        </div>
      </section>

      {error && <div className="alert error">{error}</div>}

      <section className="dashboard-summary" aria-label="Resumo das certificações">
        <div className="dashboard-view-toggle" role="group" aria-label="Visualização dos indicadores">
          <button
            type="button"
            aria-pressed={summaryView === 'cards'}
            onClick={() => setSummaryView('cards')}
          >
            Resumo em cards
          </button>
          <button
            type="button"
            aria-pressed={summaryView === 'charts'}
            onClick={() => setSummaryView('charts')}
          >
            Indicadores do sistema
          </button>
        </div>

        {summaryView === 'cards' ? (
          <section className="dashboard-stats" aria-label="Resumo em cards">
            <article className="dashboard-stat dashboard-stat-blue">
              <div className="dashboard-stat-copy">
                <p>Total de registros</p>
                <strong>{loading ? '—' : summary?.total ?? '0'}</strong>
                <small>{loading ? 'Carregando dados' : 'Atas processadas'}</small>
              </div>
            </article>

            <article className="dashboard-stat dashboard-stat-green">
              <div className="dashboard-stat-copy">
                <p>Agentes aprovados</p>
                <strong>{loading ? '—' : summary?.aprovados ?? '0'}</strong>
                <small>{loading ? 'Carregando dados' : 'Com código gerado'}</small>
              </div>
            </article>

            <article className="dashboard-stat dashboard-stat-purple">
              <div className="dashboard-stat-copy">
                <p>Reprovados</p>
                <strong>{loading ? '—' : summary?.reprovados ?? '0'}</strong>
                <small>{loading ? 'Carregando dados' : 'Sem emissão de código'}</small>
              </div>
            </article>
          </section>
        ) : (
          <section className="dashboard-charts" aria-label="Gráficos do resumo das certificações">
            <Suspense fallback={<div className="dashboard-chart-state" role="status">Carregando gráficos…</div>}>
              <DashboardCharts summary={summary} loading={loading} />
            </Suspense>
          </section>
        )}
      </section>

      <section className="dashboard-recent">
        <div className="dashboard-recent-heading">
          <div className="dashboard-recent-title">
            <div>
              <h2>Certificações recentes</h2>
              <p>Últimos concluintes cadastrados no sistema</p>
            </div>
          </div>
          <div className="dashboard-recent-actions">
            <button className="secondary" onClick={load} title="Atualizar registros recentes" disabled={loading}>
              <RefreshCw size={15} className={loading ? 'spin' : ''} /> Atualizar
            </button>
            <button className="text-button dashboard-view-all" onClick={() => go('Consultar certificados')}>
              Ver todos <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="dashboard-loading" role="status">Carregando certificações recentes…</div>
        ) : !summary?.recentes?.length ? (
          <Empty
            image={emptyCertificatesImage}
            text="Ainda não há certificações cadastradas. Emita uma ata para começar."
          />
        ) : (
          <div className="dashboard-recent-list">
            {summary.recentes.map((r, i) => (
              <div className="dashboard-recent-row" key={`${r.id || r.codigo}-${i}`}>
                <div className={`dashboard-person-avatar avatar-tone-${i % 5}`} aria-hidden="true">
                  {getInitials(r.nome)}
                </div>
                <div className="dashboard-recent-main">
                  <b>{r.nome}</b>
                  <small>
                    <b>{r.codigo || 'Sem código'}</b> · {r.curso} · {r.municipio}
                  </small>
                </div>
                <span className={`dashboard-result ${r.resultado === 'APROVADO' ? 'approved' : 'rejected'}`}>
                  {r.resultado === 'REPROVADO' && <XCircle size={14} aria-hidden="true" />}
                  {r.resultado}
                </span>
                {r.id && (
                  <div className="dashboard-row-actions">
                    <button
                      type="button"
                      className="action-btn edit"
                      onClick={() => handleEditRecente(r)}
                      title="Editar certificado"
                    >
                      <Pencil size={14} aria-hidden="true" /> Editar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {editingCert && (
        <EditCertificateModal
          cert={editingCert}
          onClose={() => setEditingCert(null)}
          onSave={() => {
            setEditingCert(null);
            load();
            showToast('Certificado atualizado com sucesso!');
          }}
        />
      )}

      {toast && (
        <div className="toast success">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}
    </>
  );
}

// -------------------------------------------------------------
// MODAIS DE EDIÇÃO E EXCLUSÃO
// -------------------------------------------------------------
function EditCertificateModal({ cert, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nome: cert.nome || '',
    cpf: cert.cpf || '',
    cargoFuncao: cert.cargoFuncao || '',
    municipio: cert.municipio || '',
    curso: cert.curso || 'CFAT',
    periodoInicio: cert.periodoInicio || '',
    periodoFim: cert.periodoFim || '',
    frequencia: cert.frequencia !== undefined && cert.frequencia !== null ? String(cert.frequencia) : '100',
    notaAd: cert.notaAd !== undefined && cert.notaAd !== null ? String(cert.notaAd) : '',
    notaOd: cert.notaOd !== undefined && cert.notaOd !== null ? String(cert.notaOd) : '',
    notaAf: cert.notaAf !== undefined && cert.notaAf !== null ? String(cert.notaAf) : '',
    mediaFinal: cert.mediaFinal !== undefined && cert.mediaFinal !== null ? String(cert.mediaFinal) : '',
    resultado: cert.resultado || 'APROVADO',
    observacoes: cert.observacoes || ''
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const requiresGrades = ['CFAT', 'CFATR'].includes(formData.curso);

  function updateField(k, v) {
    setFormData(prev => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');

    const payload = {
      nome: formData.nome.trim(),
      cargoFuncao: formData.cargoFuncao.trim(),
      municipio: formData.municipio.trim(),
      curso: formData.curso,
      periodoInicio: formData.periodoInicio,
      periodoFim: formData.periodoFim,
      frequencia: Number(formData.frequencia),
      resultado: formData.resultado,
      observacoes: formData.observacoes ? formData.observacoes.trim() : null
    };

    // Só envia CPF se o usuário digitou um novo (sem máscara de asteriscos)
    if (formData.cpf && !formData.cpf.includes('*')) {
      payload.cpf = formData.cpf.replace(/\D/g, '');
    }

    payload.notaAd = formData.notaAd === '' ? null : Number(formData.notaAd);
    payload.notaOd = formData.notaOd === '' ? null : Number(formData.notaOd);
    payload.notaAf = formData.notaAf === '' ? null : Number(formData.notaAf);
    payload.mediaFinal = formData.mediaFinal === '' ? null : Number(formData.mediaFinal);

    try {
      const updated = await api(`/certificacoes/${cert.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      onSave(updated);
    } catch (err) {
      setError(err.message || 'Erro ao atualizar certificado');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Editar Certificação</h2>
            <small style={{ color: '#64748b', fontSize: '12px' }}>
              Código Oficial: <strong style={{ color: '#2563eb' }}>{cert.codigo || 'Sem código'}</strong>
            </small>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="modal-body">
            {error && <div className="alert error" style={{ marginBottom: '16px' }}>{error}</div>}

            <div style={{ display: 'grid', gap: '18px' }}>
              <div>
                <b style={{ fontSize: '13px', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                  1. Dados do Concluinte
                </b>
                <div className="form-grid" style={{ marginTop: 0 }}>
                  <label className="wide">
                    Nome completo <span className="required-mark" aria-hidden="true">*</span>
                    <input
                      className="input"
                      required
                      minLength={3}
                      maxLength={200}
                      autoComplete="name"
                      value={formData.nome}
                      onChange={e => updateField('nome', e.target.value)}
                    />
                  </label>
                  <label>
                    CPF (digite apenas se for alterar)
                    <input
                      className="input"
                      value={formData.cpf}
                      onChange={e => updateField('cpf', formatCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                      maxLength={14}
                      pattern={formData.cpf.includes('*') ? undefined : '[0-9]{3}[.][0-9]{3}[.][0-9]{3}-[0-9]{2}'}
                      title="Informe um CPF no formato 000.000.000-00"
                    />
                  </label>
                  <label>
                    Cargo / Função <span className="required-mark" aria-hidden="true">*</span>
                    <input
                      className="input"
                      required
                      minLength={2}
                      maxLength={120}
                      value={formData.cargoFuncao}
                      onChange={e => updateField('cargoFuncao', e.target.value)}
                    />
                  </label>
                  <label>
                    Frequência (%) <span className="required-mark" aria-hidden="true">*</span>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      required
                      value={formData.frequencia}
                      onChange={e => updateField('frequencia', e.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div>
                <b style={{ fontSize: '13px', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                  2. Curso e Período
                </b>
                <div className="form-grid" style={{ marginTop: 0 }}>
                  <label>
                    Curso homologado <span className="required-mark" aria-hidden="true">*</span>
                    <select className="input" required value={formData.curso} onChange={e => updateField('curso', e.target.value)}>
                      {courses.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Município <span className="required-mark" aria-hidden="true">*</span>
                    <input
                      className="input"
                      required
                      minLength={2}
                      maxLength={120}
                      value={formData.municipio}
                      onChange={e => updateField('municipio', e.target.value)}
                    />
                  </label>
                  <label>
                    Data de Início <span className="required-mark" aria-hidden="true">*</span>
                    <input
                      className="input"
                      type="date"
                      required
                      value={formData.periodoInicio}
                      onChange={e => updateField('periodoInicio', e.target.value)}
                    />
                  </label>
                  <label>
                    Data de Conclusão <span className="required-mark" aria-hidden="true">*</span>
                    <input
                      className="input"
                      type="date"
                      required
                      value={formData.periodoFim}
                      onChange={e => updateField('periodoFim', e.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div>
                <b style={{ fontSize: '13px', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                  3. Avaliação e Resultado
                </b>
                <div className="form-grid" style={{ marginTop: 0 }}>
                  <>
                      <label>
                        Nota AD{requiresGrades && <> <span className="required-mark" aria-hidden="true">*</span></>}
                        <input
                          className="input"
                          type="number"
                          min="0"
                          max="10"
                          step="0.01"
                          required={requiresGrades}
                          value={formData.notaAd}
                          onChange={e => updateField('notaAd', e.target.value)}
                        />
                      </label>
                      <label>
                        Nota OD{requiresGrades && <> <span className="required-mark" aria-hidden="true">*</span></>}
                        <input
                          className="input"
                          type="number"
                          min="0"
                          max="10"
                          step="0.01"
                          required={requiresGrades}
                          value={formData.notaOd}
                          onChange={e => updateField('notaOd', e.target.value)}
                        />
                      </label>
                      <label>
                        Nota AF{requiresGrades && <> <span className="required-mark" aria-hidden="true">*</span></>}
                        <input
                          className="input"
                          type="number"
                          min="0"
                          max="10"
                          step="0.01"
                          required={requiresGrades}
                          value={formData.notaAf}
                          onChange={e => updateField('notaAf', e.target.value)}
                        />
                      </label>
                      <label>
                        Média Final{requiresGrades && <> <span className="required-mark" aria-hidden="true">*</span></>}
                        <input
                          className="input"
                          type="number"
                          min="0"
                          max="10"
                          step="0.01"
                          required={requiresGrades}
                          value={formData.mediaFinal}
                          onChange={e => updateField('mediaFinal', e.target.value)}
                        />
                      </label>
                  </>

                  <label className="wide">
                    Resultado Final <span className="required-mark" aria-hidden="true">*</span>
                    <select className="input" required value={formData.resultado} onChange={e => updateField('resultado', e.target.value)}>
                      <option value="APROVADO">APROVADO (Possui / gera código oficial)</option>
                      <option value="REPROVADO">REPROVADO (Sem emissão de código)</option>
                    </select>
                  </label>

                  <label className="wide">
                    Observações
                    <textarea
                      className="input"
                      rows="2"
                      maxLength={500}
                      value={formData.observacoes}
                      onChange={e => updateField('observacoes', e.target.value)}
                      placeholder="Informações adicionais..."
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary" onClick={onClose} disabled={busy}>
              Cancelar
            </button>
            <button type="submit" className="primary" disabled={busy}>
              {busy ? (
                <>
                  <LoaderCircle className="spin" size={17} aria-hidden="true" /> Salvando alterações…
                </>
              ) : (
                <>
                  <CheckCircle2 size={17} /> Salvar alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteCertificateModal({ cert, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setBusy(true);
    setError('');
    try {
      await api(`/certificacoes/${cert.id}`, { method: 'DELETE' });
      onConfirm(cert.id);
    } catch (err) {
      setError(err.message || 'Erro ao excluir certificado');
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fee2e2', color: '#dc2626', display: 'grid', placeItems: 'center' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', color: '#0f172a' }}>Confirmar Exclusão</h2>
              <small style={{ color: '#64748b' }}>Esta ação é irreversível</small>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert error" style={{ marginBottom: '14px' }}>{error}</div>}

          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>
            Tem certeza que deseja excluir permanentemente a certificação de <b>{cert.nome}</b>?
          </p>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', fontSize: '13px', display: 'grid', gap: '6px' }}>
            <div><span style={{ color: '#64748b' }}>Código:</span> <b>{cert.codigo || 'Sem código'}</b></div>
            <div><span style={{ color: '#64748b' }}>CPF:</span> <b>{cert.cpf}</b></div>
            <div><span style={{ color: '#64748b' }}>Curso:</span> <b>{cert.curso} ({cert.municipio})</b></div>
            <div><span style={{ color: '#64748b' }}>Resultado:</span> <b style={{ color: cert.resultado === 'APROVADO' ? '#16a34a' : '#dc2626' }}>{cert.resultado}</b></div>
          </div>

          <div className="alert error" style={{ marginTop: '16px', fontSize: '12px' }}>
            Atenção: A exclusão removerá permanentemente este certificado da base do CETRAN/PA. Consultas públicas futuras deste código não encontrarão o registro.
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="danger-btn" onClick={handleDelete} disabled={busy}>
            {busy ? (
              <>
                <LoaderCircle className="spin" size={17} aria-hidden="true" /> Excluindo…
              </>
            ) : (
              <>
                <Trash2 size={17} /> Excluir definitivamente
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// CONSULTAR REGISTROS (PESQUISA DIRETA, EDIÇÃO E EXCLUSÃO)
// -------------------------------------------------------------
function Records() {
  const [filters, setFilters] = useState({ nome: '', cpf: '', municipio: '', curso: '', codigo: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [showingAll, setShowingAll] = useState(false);
  const [listingAll, setListingAll] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [deletingCert, setDeletingCert] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  async function fetchAllRecords() {
    const tamanho = 100;
    const carregarPagina = (numero) => {
      const params = new URLSearchParams({
        todos: '1',
        pagina: String(numero),
        tamanho: String(tamanho)
      });
      return api(`/certificacoes?${params}`);
    };

    const primeiraPagina = await carregarPagina(1);
    if (primeiraPagina.itens.length >= primeiraPagina.total) return primeiraPagina;

    const itens = new Map(primeiraPagina.itens.map(item => [item.id, item]));
    const totalPaginas = Math.ceil(primeiraPagina.total / tamanho);
    for (let inicio = 2; inicio <= totalPaginas; inicio += 5) {
      const paginas = Array.from(
        { length: Math.min(5, totalPaginas - inicio + 1) },
        (_, indice) => carregarPagina(inicio + indice)
      );
      const respostas = await Promise.all(paginas);
      respostas.forEach(resposta => resposta.itens.forEach(item => itens.set(item.id, item)));
    }

    return { ...primeiraPagina, itens: Array.from(itens.values()) };
  }

  async function search(e, pageNumber = 1, showAll = false) {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (showAll) {
      params.set('todos', '1');
    } else {
      Object.entries(filters).forEach(([k, v]) => {
        if (v.trim()) params.set(k, v.trim());
      });
    }
    if (!showAll) {
      params.set('pagina', String(pageNumber));
      params.set('tamanho', '20');
    }

    if (!showAll && !params.has('nome') && !params.has('cpf') && !params.has('municipio') && !params.has('curso') && !params.has('codigo')) {
      setError('Informe ao menos um critério para pesquisar (Nome, CPF, Município, Curso ou Código) ou clique em "Listar todos".');
      return;
    }

    setBusy(true);
    setListingAll(showAll);
    setError('');
    try {
      setResult(showAll ? await fetchAllRecords() : await api(`/certificacoes?${params}`));
      setPagina(pageNumber);
      setShowingAll(showAll);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      setListingAll(false);
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
          <p className="date">SISCERT · CONSULTA E GESTÃO</p>
          <h1>Consultar e Gerenciar Certificados</h1>
          <p className="subtitle">Pesquise agentes cadastrados, edite dados cadastrais e gerencie certificados homologados.</p>
        </div>
      </div>

      <form className="filter-card" onSubmit={search}>
        <div className="filters" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <label>
            Nome do concluinte
            <input className="input" value={filters.nome} onChange={e => change('nome', e.target.value)} placeholder="Ex.: Maria da Silva" />
          </label>
          <label>
            Código oficial
            <input className="input" value={filters.codigo} onChange={e => change('codigo', e.target.value.toUpperCase())} placeholder="Ex.: CAAT2025.0001" />
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
            {busy ? <LoaderCircle className="spin" size={17} aria-hidden="true" /> : <Search size={17} aria-hidden="true" />} Pesquisar
          </button>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => search(undefined, 1, true)}
          >
            {listingAll ? <><LoaderCircle className="spin" size={17} aria-hidden="true" /> Carregando todos...</> : 'Listar todos'}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setFilters({ nome: '', cpf: '', municipio: '', curso: '', codigo: '' });
              setResult(null);
              setError('');
              setPagina(1);
              setShowingAll(false);
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
              {result ? `${result.total} registro(s) encontrado(s)` : 'Informe os filtros acima ou clique em "Listar todos" para exibir.'}
            </p>
          </div>
          {result?.itens?.length > 0 && (
            <button className="secondary" onClick={exportCsv}>
              <Download size={16} /> Exportar CSV
            </button>
          )}
        </div>

        {!result ? (
          <Empty
            image={emptyCertificatesImage}
            text="Os registros encontrados na pesquisa aparecerão aqui. Clique em 'Listar todos' para ver todos os certificados."
          />
        ) : !result.itens.length ? (
          <Empty image={emptySearchResultsImage} text="Nenhum certificado encontrado para os critérios pesquisados." />
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
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {result.itens.map((r, i) => (
                  <tr key={`${r.id || r.codigo}-${i}`}>
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
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="action-btn edit"
                          onClick={() => setEditingCert(r)}
                          title="Editar este certificado"
                        >
                          <Pencil size={14} aria-hidden="true" /> Editar
                        </button>
                        <button
                          type="button"
                          className="action-btn delete"
                          onClick={() => setDeletingCert(r)}
                          title="Excluir este certificado"
                        >
                          <Trash2 size={13} /> Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result && !showingAll && result.total > 20 && (
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

      {editingCert && (
        <EditCertificateModal
          cert={editingCert}
          onClose={() => setEditingCert(null)}
          onSave={(updated) => {
            setResult(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                itens: prev.itens.map(item => (item.id === updated.id ? updated : item))
              };
            });
            setEditingCert(null);
            showToast('Certificado atualizado com sucesso!');
          }}
        />
      )}

      {deletingCert && (
        <DeleteCertificateModal
          cert={deletingCert}
          onClose={() => setDeletingCert(null)}
          onConfirm={(id) => {
            setResult(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                total: Math.max(0, prev.total - 1),
                itens: prev.itens.filter(item => item.id !== id)
              };
            });
            setDeletingCert(null);
            showToast('Certificado excluído com sucesso!');
          }}
        />
      )}

      {toast && (
        <div className="toast success">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}
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

  const requiresGrades = ['CFAT', 'CFATR'].includes(ata.curso);

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
              Curso homologado <span className="required-mark" aria-hidden="true">*</span>
              <select className="input" required value={ata.curso} onChange={e => updateAta('curso', e.target.value)}>
                {courses.map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Município <span className="required-mark" aria-hidden="true">*</span>
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
              Data de Início <span className="required-mark" aria-hidden="true">*</span>
              <input className="input" type="date" required value={ata.periodoInicio} onChange={e => updateAta('periodoInicio', e.target.value)} />
            </label>
            <label>
              Data de Conclusão <span className="required-mark" aria-hidden="true">*</span>
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
                <div className="form-section-label wide">Identificação do concluinte</div>
                <label>
                  Nome completo <span className="required-mark" aria-hidden="true">*</span>
                  <input
                    className="input"
                    required
                    minLength={3}
                    maxLength={200}
                    autoComplete="name"
                    value={p.nome}
                    onChange={e => updatePerson(i, 'nome', e.target.value)}
                    placeholder="Nome completo do agente"
                  />
                </label>

                <label>
                  CPF <span className="required-mark" aria-hidden="true">*</span>
                  <input
                    className="input"
                    required
                    inputMode="numeric"
                    maxLength={14}
                    autoComplete="off"
                    pattern="[0-9]{3}[.][0-9]{3}[.][0-9]{3}-[0-9]{2}"
                    title="Informe um CPF no formato 000.000.000-00"
                    placeholder="000.000.000-00"
                    value={p.cpf}
                    onChange={e => updatePerson(i, 'cpf', formatCpf(e.target.value))}
                  />
                </label>

                <label>
                  Cargo ou Função <span className="required-mark" aria-hidden="true">*</span>
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

                <div className="form-section-label wide">Avaliação do curso</div>
                <label>
                  Frequência (%) <span className="required-mark" aria-hidden="true">*</span>
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

                {['notaAd', 'notaOd', 'notaAf', 'mediaFinal'].map(k => (
                  <label key={k}>
                    {{ notaAd: 'Nota AD', notaOd: 'Nota OD', notaAf: 'Nota AF', mediaFinal: 'Média final' }[k]}
                    {requiresGrades && <> <span className="required-mark" aria-hidden="true">*</span></>}
                    <input
                      className="input"
                      type="number"
                      min="0"
                      max="10"
                      step="0.01"
                      required={requiresGrades}
                      value={p[k]}
                      onChange={e => updatePerson(i, k, e.target.value)}
                    />
                  </label>
                ))}

                <label>
                  Resultado final <span className="required-mark" aria-hidden="true">*</span>
                  <select className="input" required value={p.resultado} onChange={e => updatePerson(i, 'resultado', e.target.value)}>
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
                <LoaderCircle className="spin" size={18} aria-hidden="true" /> Processando ata…
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
  const [showSuccessNotice, setShowSuccessNotice] = useState(false);

  useEffect(() => {
    if (!data || !showSuccessNotice) return undefined;
    const timeout = setTimeout(() => setShowSuccessNotice(false), 5000);
    return () => clearTimeout(timeout);
  }, [data, showSuccessNotice]);

  async function verify(e) {
    e.preventDefault();
    setBusy(true);
    setData(null);
    setShowSuccessNotice(false);
    setError('');
    try {
      const certificado = await api(`/certificacoes/${encodeURIComponent(codigo.trim().toUpperCase())}`);
      setData(certificado);
      setShowSuccessNotice(true);
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
              <LockKeyhole size={15} aria-hidden="true" /> Entrar no sistema
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
            Código do certificado <span className="required-mark" aria-hidden="true">*</span>
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
            {busy ? <LoaderCircle className="spin" size={18} aria-hidden="true" /> : <Search size={18} aria-hidden="true" />} Conferir Autenticidade
          </button>
        </form>

        {error && <div className="alert error">{error}</div>}

        {data && (
          <div className="verification-result" style={{ marginTop: '22px' }}>
            <section className="verification-section">
              <h3>Identificação</h3>
              <div className="detail-grid">
                <Detail label="Código Oficial" value={data.codigo} highlight />
                <Detail label="Nome do Concluinte" value={data.nome} />
              </div>
            </section>

            <section className="verification-section">
              <h3>Curso e realização</h3>
              <div className="detail-grid">
                <Detail label="Curso Homologado" value={data.curso} />
                <Detail label="Município" value={data.municipio} />
                <Detail label="Período de Realização" value={`${formatDate(data.periodoInicio)} a ${formatDate(data.periodoFim)}`} />
              </div>
            </section>

            <section className="verification-section">
              <h3>Resultado e avaliação</h3>
              <div className="detail-grid">
                <Detail label="Resultado" value={data.resultado} />
                <Detail label="Frequência" value={formatNumber(data.frequencia, '%')} />
                {data.notaAd !== null && data.notaAd !== undefined && (
                  <Detail label="Nota AD" value={formatNumber(data.notaAd)} />
                )}
                {data.notaOd !== null && data.notaOd !== undefined && (
                  <Detail label="Nota OD" value={formatNumber(data.notaOd)} />
                )}
                {data.notaAf !== null && data.notaAf !== undefined && (
                  <Detail label="Nota AF" value={formatNumber(data.notaAf)} />
                )}
                {data.mediaFinal !== null && data.mediaFinal !== undefined && (
                  <Detail label="Média Final" value={formatNumber(data.mediaFinal)} />
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {data && showSuccessNotice && (
        <div className="verification-toast" role="status" aria-live="polite">
          <CheckCircle2 size={24} aria-hidden="true" />
          <div className="verification-toast-copy">
            <b>Certificado Autêntico e Válido</b>
            <span>Registro localizado na base oficial de certificações do CETRAN/PA.</span>
          </div>
          <button
            type="button"
            className="verification-toast-close"
            onClick={() => setShowSuccessNotice(false)}
            aria-label="Fechar aviso"
            title="Fechar aviso"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}

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
    <div className={`detail${highlight ? ' highlight' : ''}`}>
      <small>{label}</small>
      <b>{value || '—'}</b>
    </div>
  );
}

function Empty({ image, text }) {
  return (
    <div className="empty">
      <img src={image} alt="" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}

function formatDate(v) {
  if (!v) return '—';
  const [y, m, d] = v.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function formatNumber(value, suffix = '') {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '—';
  return `${numeric.toFixed(2).replace('.', ',')}${suffix}`;
}

function formatCpf(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function getInitials(name) {
  return (name || 'SC')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toLocaleUpperCase('pt-BR') || '')
    .join('');
}

createRoot(document.getElementById('root')).render(<App />);
