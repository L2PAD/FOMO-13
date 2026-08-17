import React from 'react';
import { T, KpiCard, KpiGrid, useAsync, fmtNum } from '../Statistics/ui';
import { fetchEarlyLandFunnel } from '../../components/services/taskCenter';

const card: React.CSSProperties = { background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 };
const th: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 800, color: T.faint, textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: `1px solid ${T.border}`, background: T.soft, whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '10px 12px', fontSize: 13, color: T.ink, borderBottom: `1px solid ${T.border}` };

const FunnelRow: React.FC<{ step: any; max: number }> = ({ step, max }) => {
  const width = step.users === null || max === 0 ? 0 : Math.max(4, Math.round((step.users / max) * 100));
  return (
    <div style={{ marginBottom: 12 }} data-testid={`funnel-step-${step.key}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{step.labelRu}</span>
        <span style={{ fontSize: 12.5, color: T.sub }}>
          {step.users === null ? 'не отслеживается' : (
            <>
              <b style={{ color: T.ink }}>{fmtNum(step.users)}</b>
              {step.conversionFromPrev !== null ? <span style={{ color: T.sub }}> · {step.conversionFromPrev}% от пред.</span> : null}
              {step.dropOff ? <span style={{ color: T.bad }}> · −{fmtNum(step.dropOff)}</span> : null}
            </>
          )}
        </span>
      </div>
      <div style={{ height: 12, borderRadius: 999, background: T.soft, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${width}%`,
          background: step.tracked ? `linear-gradient(90deg, #7C3AED, ${T.accent})` : 'repeating-linear-gradient(45deg, #C7CBD3, #C7CBD3 6px, #E3E6EC 6px, #E3E6EC 12px)',
          transition: 'width 220ms ease',
        }} />
      </div>
    </div>
  );
};

const EarlyLandStats: React.FC = () => {
  const stats = useAsync(() => fetchEarlyLandFunnel(30), []);
  const d = stats.data;

  if (stats.loading) {
    return <div data-testid="earlyland-stats" style={{ padding: 40, textAlign: 'center', color: T.sub, ...card }}>Загрузка статистики…</div>;
  }
  if (stats.error || !d) {
    return <div data-testid="earlyland-stats" style={{ padding: 40, textAlign: 'center', color: T.bad, ...card }}>Не удалось загрузить статистику.</div>;
  }

  const a = d.audience || {};
  const x = d.xp || {};
  const funnel: any[] = d.funnel || [];
  const funnelMax = Math.max(1, ...funnel.filter((s: any) => s.users !== null).map((s: any) => s.users));
  const grants = a.grants || {};

  return (
    <div data-testid="earlyland-stats" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontSize: 13.5, color: T.sub, marginBottom: 12 }}>
          Единый read-model EarlyLand: аудитория, воронка участия и начисленный XP. Данные из TaskUserProgress, XP Ledger и грантов доступа.
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.ink, marginBottom: 8 }}>Аудитория</div>
        <KpiGrid min={150}>
          <KpiCard testId="el-unique" label="Уникальных пользователей" value={fmtNum(a.uniqueUsers)} />
          <KpiCard label="Активны за 1 день" value={fmtNum(a.active1)} />
          <KpiCard label="Активны за 7 дней" value={fmtNum(a.active7)} />
          <KpiCard label="Активны за 30 дней" value={fmtNum(a.active30)} />
          <KpiCard label="Prime-пользователи" value={fmtNum(a.primeUsers)} tone="warn" />
          <KpiCard label="Public-пользователи" value={fmtNum(a.publicUsers)} />
          <KpiCard label="Активные гранты" value={fmtNum(grants.active)} tone="good" />
          <KpiCard label="Истёкшие гранты" value={fmtNum(grants.expired)} />
          <KpiCard label="Отозванные гранты" value={fmtNum(grants.revoked)} tone="bad" />
        </KpiGrid>
      </div>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 4 }}>Воронка участия</div>
        <div style={{ fontSize: 12.5, color: T.sub, marginBottom: 18 }}>
          Просмотр активности → Открытие задания → Добавлено в мои задачи → Начато → Отправлено → Одобрено → XP начислено
        </div>
        {funnel.map((step: any) => <FunnelRow key={step.key} step={step} max={funnelMax} />)}
        <div style={{ fontSize: 11.5, color: T.faint, marginTop: 8 }}>
          «Просмотр» и «Открытие» пока не трекаются событиями — показаны честно как «не отслеживается».
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.ink, marginBottom: 8 }}>XP</div>
        <KpiGrid min={170}>
          <KpiCard testId="el-xp-awarded" label="Начислено XP (EarlyLand)" value={fmtNum(x.awarded)} tone="good" />
          <KpiCard label="Получателей" value={fmtNum(x.recipients)} />
          <KpiCard label="Начислений" value={fmtNum(x.awards)} />
          <KpiCard label="XP на пользователя" value={fmtNum(x.perUser)} />
          <KpiCard label="Потенциальный XP" value={fmtNum(d.tasks?.potentialXp)} tone="warn" />
        </KpiGrid>
      </div>

      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', fontSize: 14, fontWeight: 800, color: T.ink, borderBottom: `1px solid ${T.border}` }}>По активностям</div>
        {(d.byActivity || []).length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: T.faint, fontSize: 13.5 }}>Пока нет данных по активностям EarlyLand.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Активность</th><th style={th}>Заданий</th><th style={th}>Добавили</th><th style={th}>Начали</th><th style={th}>Отправили</th><th style={th}>Одобрено</th><th style={th}>Потенц. XP</th>
            </tr></thead>
            <tbody>
              {(d.byActivity || []).map((r: any) => (
                <tr key={r.activityId} data-testid="el-activity-row">
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{r.activityId === 'unlinked' ? 'Без привязки' : r.activityId}</td>
                  <td style={td}>{fmtNum(r.tasks)}</td>
                  <td style={td}>{fmtNum(r.added)}</td>
                  <td style={td}>{fmtNum(r.started)}</td>
                  <td style={td}>{fmtNum(r.submitted)}</td>
                  <td style={{ ...td, color: T.good, fontWeight: 700 }}>{fmtNum(r.approved)}</td>
                  <td style={{ ...td, color: T.accent, fontWeight: 700 }}>{fmtNum(r.potentialXp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default EarlyLandStats;
