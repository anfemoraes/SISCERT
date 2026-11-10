import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const colors = {
  primary: '#1351b4',
  success: '#16866b',
  danger: '#b42318'
};

function toCount(value) {
  const count = Number(value);
  return Number.isFinite(count) ? Math.max(0, count) : 0;
}

export default function DashboardCharts({ summary, loading }) {
  if (loading) {
    return (
      <>
        <ChartCard title="Indicadores do sistema" description="Comparativo de registros e resultados">
          <div className="dashboard-chart-state" role="status">Carregando gráfico…</div>
        </ChartCard>
        <ChartCard title="Resultado dos agentes" description="Distribuição de aprovados e reprovados">
          <div className="dashboard-chart-state" role="status">Carregando gráfico…</div>
        </ChartCard>
      </>
    );
  }

  if (!summary) {
    return (
      <>
        <ChartCard title="Indicadores do sistema" description="Comparativo de registros e resultados">
          <div className="dashboard-chart-state" role="status">Dados do gráfico indisponíveis.</div>
        </ChartCard>
        <ChartCard title="Resultado dos agentes" description="Distribuição de aprovados e reprovados">
          <div className="dashboard-chart-state" role="status">Dados do gráfico indisponíveis.</div>
        </ChartCard>
      </>
    );
  }

  const approved = toCount(summary.aprovados);
  const rejected = toCount(summary.reprovados);
  const chartData = [
    { name: 'Total de registros', value: toCount(summary.total) },
    { name: 'Agentes aprovados', value: approved },
    { name: 'Reprovados', value: rejected }
  ];
  const resultData = [
    { name: 'Aprovados', value: approved, color: colors.success },
    { name: 'Reprovados', value: rejected, color: colors.danger }
  ].filter(item => item.value > 0);
  const classifiedAgents = approved + rejected;

  return (
    <>
      <ChartCard title="Indicadores do sistema" description="Comparativo de registros e resultados">
        <div className="dashboard-bar-chart" role="img" aria-label="Gráfico de barras com total de registros, agentes aprovados e reprovados">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 12, left: 0, bottom: 4 }} accessibilityLayer>
              <CartesianGrid stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fill: '#526579', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={116} tick={{ fill: '#526579', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ border: '1px solid #cbd5e1', borderRadius: 4, color: '#1b1b1b' }}
              />
              <Bar dataKey="value" name="Quantidade" fill={colors.primary} radius={[3, 3, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Resultado dos agentes" description="Distribuição de aprovados e reprovados">
        {classifiedAgents === 0 ? (
          <div className="dashboard-chart-state" role="status">Ainda não há resultados para exibir.</div>
        ) : (
          <>
            <div className="dashboard-donut-wrap">
              <div
                className="dashboard-donut-chart"
                role="img"
                aria-label={`Gráfico de resultados: ${approved} aprovados e ${rejected} reprovados`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart accessibilityLayer>
                    <Pie
                      data={resultData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="68%"
                      outerRadius="92%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {resultData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ border: '1px solid #cbd5e1', borderRadius: 4, color: '#1b1b1b' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="dashboard-donut-total" aria-hidden="true">
                  <strong>{classifiedAgents}</strong>
                  <span>agentes</span>
                </div>
              </div>
            </div>
            <ul className="dashboard-chart-legend">
              {[
                { name: 'Aprovados', value: approved, color: colors.success },
                { name: 'Reprovados', value: rejected, color: colors.danger }
              ].map(item => (
                <li key={item.name}>
                  <span className="dashboard-chart-legend-label"><i style={{ backgroundColor: item.color }} />{item.name}</span>
                  <strong>{item.value}</strong>
                </li>
              ))}
            </ul>
          </>
        )}
      </ChartCard>
    </>
  );
}

function ChartCard({ title, description, children }) {
  return (
    <article className="dashboard-chart chart-card">
      <div className="dashboard-chart-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </article>
  );
}
