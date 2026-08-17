import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/layouts/main_layout/layout';
import { T, KpiCard, KpiGrid, useAsync, fmtNum } from '../Statistics/ui';
import { AdminSelect } from '../AdminRating/AdminControls';
import {
  fetchTaskOverview,
  fetchTaskAnalytics,
  fetchTaskReviewQueue,
  fetchTaskMetricsCatalog,
  fetchAdminTasks,
  fetchUserTasks,
  fetchDiagnostics,
  createGlobalTask,
  confirmTaskReview,
  rejectTaskReview,
  deleteTaskById,
} from '../../components/services/taskCenter';

type TabKey =
  | 'overview'
  | 'global'
  | 'review'
  | 'calendar'
  | 'analytics'
  | 'diagnostics';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Обзор' },
  { key: 'global', label: 'Глобальные' },
  { key: 'review', label: 'Проверка' },
  { key: 'calendar', label: 'Календарь' },
  { key: 'analytics', label: 'Аналитика' },
  { key: 'diagnostics', label: 'Диагностика' },
];

const MODE_LABEL: Record<string, string> = {
  AUTO_METRIC: 'Автоматически',
  USER_CLAIM: 'Клейм',
  MODERATOR_REVIEW: 'Проверка',
  EXTERNAL_ACTION: 'Внешнее действие',
};

const card: React.CSSProperties = {
  background: T.cardBg,
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  overflow: 'hidden',
};
const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '11px 14px',
  fontSize: 11.5,
  fontWeight: 800,
  color: T.faint,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  borderBottom: `1px solid ${T.border}`,
  background: T.soft,
  whiteSpace: 'nowrap',
};
const td: React.CSSProperties = {
  padding: '11px 14px',
  fontSize: 13.5,
  color: T.ink,
  borderBottom: `1px solid ${T.border}`,
  verticalAlign: 'middle',
};

const Chip: React.FC<{ tone?: string; children: React.ReactNode }> = ({ tone = 'default', children }) => {
  const map: Record<string, { bg: string; fg: string }> = {
    good: { bg: '#E7F6F3', fg: T.good },
    bad: { bg: '#FDECEC', fg: T.bad },
    warn: { bg: '#FEF3E2', fg: T.warn },
    info: { bg: '#EEF2FF', fg: T.accent },
    default: { bg: T.soft, fg: T.sub },
  };
  const c = map[tone] || map.default;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: c.bg, color: c.fg, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
};

const Empty: React.FC<{ text?: string }> = ({ text }) => (
  <div style={{ padding: 44, textAlign: 'center', color: T.faint, fontSize: 14 }}>{text || 'Пока ничего нет.'}</div>
);
const LoadingRow: React.FC = () => (
  <div style={{ padding: 40, textAlign: 'center', color: T.sub, fontSize: 14 }}>Загрузка…</div>
);

/* ─────────────────────────── Overview ─────────────────────────── */
const OverviewTab: React.FC = () => {
  const overview = useAsync(() => fetchTaskOverview(30), []);
  const analytics = useAsync(() => fetchTaskAnalytics(30), []);
  const k = overview.data?.kpis || {};
  return (
    <div data-testid="tc-overview">
      {overview.loading ? (
        <LoadingRow />
      ) : (
        <KpiGrid>
          <KpiCard testId="kpi-active" label="Активных заданий" value={fmtNum(k.activeTasks)} />
          <KpiCard testId="kpi-inprogress" label="Выполняют сейчас" value={fmtNum(k.usersInProgress)} tone="warn" />
          <KpiCard testId="kpi-completions" label="Выполнений за 30 дн" value={fmtNum(k.completionsInPeriod)} tone="good" />
          <KpiCard testId="kpi-pending" label="Ожидают проверки" value={fmtNum(k.pendingReview)} tone="warn" />
          <KpiCard testId="kpi-rejected" label="Отклонено" value={fmtNum(k.rejected)} tone="bad" />
          <KpiCard testId="kpi-xp" label="Начислено XP" value={fmtNum(k.xpAwarded)} tone="good" />
          <KpiCard testId="kpi-avg" label="Средняя завершённость" value={`${k.avgCompletionRate || 0}%`} />
          <KpiCard testId="kpi-campaigns" label="Активных EarlyLand-кампаний" value={fmtNum(k.activeCampaigns)} />
        </KpiGrid>
      )}

      <div style={{ marginTop: 22, ...card }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}`, fontWeight: 800, color: T.ink, fontSize: 15 }}>
          Core / Global против EarlyLand
        </div>
        {analytics.loading ? (
          <LoadingRow />
        ) : (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: 16 }}>
            {(analytics.data?.coreVsEarlyland || []).length === 0 ? (
              <Empty text="Ещё нет выполнений." />
            ) : (
              (analytics.data?.coreVsEarlyland || []).map((g: any) => (
                <div key={g.eventType} style={{ flex: '1 1 240px', background: T.soft, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: T.faint, textTransform: 'uppercase', letterSpacing: 0.3 }}>{g.group}</div>
                  <div style={{ display: 'flex', gap: 24, marginTop: 10 }}>
                    <div><div style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>{fmtNum(g.completions)}</div><div style={{ fontSize: 12, color: T.sub }}>выполнений</div></div>
                    <div><div style={{ fontSize: 22, fontWeight: 800, color: T.accent }}>{fmtNum(g.xp)}</div><div style={{ fontSize: 12, color: T.sub }}>XP</div></div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────── Global tasks ─────────────────────────── */
const GlobalTab: React.FC = () => {
  const tasks = useAsync(() => fetchAdminTasks('global'), []);
  const [drawer, setDrawer] = useState(false);
  const rows: any[] = tasks.data || [];
  return (
    <div data-testid="tc-global">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13.5, color: T.sub }}>Долгосрочные цели пользователя по всей платформе. Награда — единый XP через Ledger.</div>
        <button data-testid="create-global-btn" onClick={() => setDrawer(true)}
          style={{ border: 'none', background: T.accent, color: '#fff', fontWeight: 700, fontSize: 13.5, padding: '10px 16px', borderRadius: 10, cursor: 'pointer' }}>
          + Создать задание
        </button>
      </div>
      <div style={card}>
        {tasks.loading ? <LoadingRow /> : rows.length === 0 ? <Empty text="Нет глобальных заданий." /> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Задание</th><th style={th}>Метрика</th><th style={th}>Цель</th><th style={th}>XP</th>
              <th style={th}>Проверка</th><th style={th}>Выполнили</th><th style={th}>Статус</th><th style={th}></th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} data-testid="global-task-row">
                  <td style={{ ...td, fontWeight: 700 }}>{r.name}</td>
                  <td style={td}>{r.metricLabel || '—'}{r.metric && r.metricConnected === false ? <div><Chip tone="bad">не подключено</Chip></div> : null}</td>
                  <td style={td}>{fmtNum(r.targetValue)}</td>
                  <td style={{ ...td, color: T.accent, fontWeight: 800 }}>+{fmtNum(r.points)}</td>
                  <td style={td}><Chip tone={r.completionMode === 'AUTO_METRIC' ? 'info' : 'default'}>{MODE_LABEL[r.completionMode] || r.completionMode}</Chip></td>
                  <td style={td}>{fmtNum(r.counts?.completed)}</td>
                  <td style={td}><Chip tone={r.taskStatus === 'active' ? 'good' : 'default'}>{r.taskStatus}</Chip></td>
                  <td style={td}>
                    <button data-testid="delete-task-btn" onClick={async () => { if (!window.confirm('Удалить задание?')) return; const res = await deleteTaskById(r._id); if (res.success) { toast.success('Удалено'); tasks.refetch(); } else toast.error('Ошибка'); }}
                      style={{ border: `1px solid #F3C6C6`, background: '#fff', color: T.bad, borderRadius: 8, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {drawer ? <CreateGlobalDrawer onClose={() => setDrawer(false)} onCreated={() => { setDrawer(false); tasks.refetch(); }} /> : null}
    </div>
  );
};

const CreateGlobalDrawer: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
  const catalog = useAsync(() => fetchTaskMetricsCatalog(), []);
  const [name, setName] = useState('');
  const [metric, setMetric] = useState('');
  const [operator, setOperator] = useState('>=');
  const [targetValue, setTargetValue] = useState('0');
  const [points, setPoints] = useState('100');
  const [mode, setMode] = useState('AUTO_METRIC');
  const [busy, setBusy] = useState(false);

  const items: any[] = catalog.data || [];
  const selected = items.find((i) => i.key === metric);
  const field: React.CSSProperties = { width: '100%', padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14, color: T.ink, background: '#fff', boxSizing: 'border-box' };
  const label: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: T.sub, marginBottom: 6, display: 'block' };

  const save = async () => {
    if (!name.trim()) { toast.error('Введите название'); return; }
    if (mode === 'AUTO_METRIC' && !metric) { toast.error('Выберите метрику'); return; }
    setBusy(true);
    const res = await createGlobalTask({ name: name.trim(), points: Number(points) || 0, metric, operator, targetValue: Number(targetValue) || 0, completionMode: mode });
    setBusy(false);
    if (res.success) { toast.success('Задание создано'); onCreated(); } else toast.error('Не удалось создать');
  };

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
      <div onMouseDown={(e) => e.stopPropagation()} data-testid="create-global-drawer" style={{ width: 'min(520px,100vw)', background: T.pageBg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${T.border}`, background: T.cardBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: T.ink }}>Новое глобальное задание</div>
          <button onClick={onClose} style={{ border: 'none', background: T.soft, width: 32, height: 32, borderRadius: 9, cursor: 'pointer', color: T.sub, fontSize: 18 }}>×</button>
        </div>
        <div style={{ padding: 22, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><label style={label}>Название</label><input data-testid="drawer-name" style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Достичь $10 000 в публичном портфеле" /></div>
          <div><label style={label}>Способ проверки</label>
            <AdminSelect
              testid="drawer-mode"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'AUTO_METRIC', label: 'Автоматически (по метрике)' },
                { value: 'USER_CLAIM', label: 'Клейм пользователем' },
                { value: 'MODERATOR_REVIEW', label: 'Проверка модератором' },
                { value: 'EXTERNAL_ACTION', label: 'Внешнее действие' },
              ]}
            />
          </div>
          {mode === 'AUTO_METRIC' ? (
            <>
              <div><label style={label}>Метрика</label>
                <AdminSelect
                  testid="drawer-metric"
                  value={metric}
                  onChange={setMetric}
                  searchable
                  placeholder="— выберите —"
                  options={items.map((i) => ({
                    value: i.key,
                    label: `${i.label}${i.connected ? '' : ' (не подключено)'}`,
                  }))}
                />
                {selected ? <div style={{ marginTop: 6, fontSize: 12, color: T.faint }}>Источник: {selected.source}</div> : null}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 130 }}><label style={label}>Оператор</label>
                  <AdminSelect
                    value={operator}
                    onChange={setOperator}
                    options={[
                      { value: '>=', label: '≥ (больше или равно)' },
                      { value: '>', label: '> (больше)' },
                      { value: '=', label: '= (равно)' },
                      { value: '<=', label: '≤ (меньше или равно)' },
                      { value: '<', label: '< (меньше)' },
                    ]}
                  />
                </div>
                <div style={{ flex: 1 }}><label style={label}>Значение{selected ? ` (${selected.unit})` : ''}</label><input data-testid="drawer-target" type="number" style={field} value={targetValue} onChange={(e) => setTargetValue(e.target.value)} /></div>
              </div>
            </>
          ) : null}
          <div><label style={label}>Награда (XP)</label><input data-testid="drawer-xp" type="number" style={field} value={points} onChange={(e) => setPoints(e.target.value)} /></div>
          <div style={{ background: '#EEF2FF', border: `1px solid #DDE1FB`, borderRadius: 12, padding: 14, fontSize: 13, color: T.ink }}>
            Пользователь выполнит задание{mode === 'AUTO_METRIC' && selected ? `, когда «${selected.label}» ${operator} ${targetValue} ${selected.unit}` : ''}. После подтверждения он получит {points || 0} XP через XP Ledger.
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, background: T.cardBg }}>
          <button data-testid="drawer-save" disabled={busy} onClick={save} style={{ width: '100%', border: 'none', background: T.accent, color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px', borderRadius: 10, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>{busy ? 'Сохранение…' : 'Создать задание'}</button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────── Customer 360 drawer ─────────────────────────── */
const Customer360Drawer: React.FC<{ userId: string; name: string; onClose: () => void }> = ({ userId, name, onClose }) => {
  const data = useAsync(() => fetchUserTasks(userId), [userId]);
  const k = data.data?.kpis || {};
  const section = (title: string, rows: any[]) => (
    <div style={{ ...card, marginBottom: 14 }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.border}`, fontWeight: 800, color: T.ink, fontSize: 14 }}>{title} · {rows.length}</div>
      {rows.length === 0 ? <Empty text="—" /> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={th}>Задание</th><th style={th}>Тип</th><th style={th}>Статус</th><th style={th}>XP</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}><td style={td}>{r.name}</td><td style={td}>{r.taskType === 'default' ? 'EarlyLand' : 'Core'}</td>
                <td style={td}><Chip tone={r.state === 'completed' ? 'good' : r.state === 'rejected' ? 'bad' : 'warn'}>{r.state}</Chip></td>
                <td style={{ ...td, color: T.accent, fontWeight: 800 }}>+{fmtNum(r.xp)}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
      <div onMouseDown={(e) => e.stopPropagation()} data-testid="customer360-drawer" style={{ width: 'min(620px,100vw)', background: T.pageBg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${T.border}`, background: T.cardBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div style={{ fontSize: 17, fontWeight: 800, color: T.ink }}>Задачи пользователя</div><div style={{ fontSize: 13, color: T.sub }}>{name}</div></div>
          <button onClick={onClose} style={{ border: 'none', background: T.soft, width: 32, height: 32, borderRadius: 9, cursor: 'pointer', color: T.sub, fontSize: 18 }}>×</button>
        </div>
        <div style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
          {data.loading ? <LoadingRow /> : (
            <>
              <KpiGrid min={150}>
                <KpiCard label="Выполняет" value={fmtNum(k.inProgress)} tone="warn" />
                <KpiCard label="Завершено" value={fmtNum(k.completed)} tone="good" />
                <KpiCard label="На проверке" value={fmtNum(k.pendingReview)} tone="warn" />
                <KpiCard label="Отклонено" value={fmtNum(k.rejected)} tone="bad" />
                <KpiCard label="XP из задач" value={fmtNum(k.xpFromTasks)} tone="good" />
              </KpiGrid>
              <div style={{ height: 16 }} />
              {section('Ожидают проверки', data.data?.pending || [])}
              {section('Активные', data.data?.active || [])}
              {section('История', data.data?.history || [])}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────── Review queue ─────────────────────────── */
const RISK_FLAG_LABEL: Record<string, string> = {
  TOO_FAST: 'Подозрительно быстрое выполнение',
  DUPLICATE_EVIDENCE: 'Повторно использовано доказательство',
  COMPLETION_BURST: 'Аномально много выполнений за короткое время',
  COOLDOWN_ATTEMPT: 'Попытка в период кулдауна',
  XP_CAP_REACHED: 'Достигнут лимит XP',
};

const ReviewTab: React.FC = () => {
  const queue = useAsync(() => fetchTaskReviewQueue(), []);
  const [busy, setBusy] = useState('');
  const [customer, setCustomer] = useState<{ id: string; name: string } | null>(null);
  const rows: any[] = queue.data || [];
  const act = async (kind: 'confirm' | 'reject', r: any) => {
    let reason = '';
    if (kind === 'reject') {
      reason = window.prompt('Причина отклонения (будет видна пользователю):', '') || '';
      if (reason === null) return;
    }
    setBusy(`${kind}:${r.taskId}:${r.user?._id}`);
    const res = kind === 'confirm'
      ? await confirmTaskReview(String(r.user?._id), String(r.taskId), Number(r.points || 0))
      : await rejectTaskReview(String(r.user?._id), String(r.taskId), Number(r.points || 0), reason);
    setBusy('');
    if (res.success) { toast.success(kind === 'confirm' ? `Подтверждено · +${r.points} XP` : 'Отклонено'); queue.refetch(); }
    else toast.error('Ошибка');
  };
  return (
    <div data-testid="tc-review">
      <div style={{ fontSize: 13.5, color: T.sub, marginBottom: 14 }}>Единая очередь проверок выполнения. Подтверждение начисляет XP через Ledger.</div>
      <div style={card}>
        {queue.loading ? <LoadingRow /> : rows.length === 0 ? <Empty text="Очередь проверок пуста." /> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Пользователь</th><th style={th}>Задание</th><th style={th}>Тип</th><th style={th}>Диагностика</th><th style={th}>XP</th><th style={th}>Действия</th>
            </tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} data-testid="review-row">
                  <td style={td}>
                    <button onClick={() => setCustomer({ id: String(r.user?._id), name: r.user?.username || r.user?.name || r.user?.email || 'Пользователь' })}
                      data-testid="open-customer360" style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, color: T.accent }}>{r.user?.username || r.user?.name || r.user?.email || 'Неизвестно'}</div>
                      <div style={{ fontSize: 11.5, color: T.faint }}>XP: {fmtNum(r.user?.activityXP || 0)} · карточка</div>
                    </button>
                  </td>
                  <td style={td}>{r.taskName}</td>
                  <td style={td}><Chip tone={r.taskType === 'default' ? 'info' : 'default'}>{r.taskType === 'default' ? 'EarlyLand' : 'Core'}</Chip></td>
                  <td style={td} data-testid="review-diagnostics">
                    {(r.riskFlags && r.riskFlags.length) ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {r.riskFlags.map((f: string) => (
                          <span key={f} title={RISK_FLAG_LABEL[f] || f} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: T.bad, fontWeight: 600 }}>
                            <span style={{ width: 6, height: 6, borderRadius: 999, background: T.bad, display: 'inline-block' }} />
                            {RISK_FLAG_LABEL[f] || f}
                          </span>
                        ))}
                        <span style={{ fontSize: 11, color: T.faint }}>Риск: {r.riskScore || 0}/100 · не авто-reject</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: T.good }}>Без флагов</span>
                    )}
                  </td>
                  <td style={{ ...td, color: T.accent, fontWeight: 800 }}>+{fmtNum(r.points)}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button data-testid="review-approve" disabled={!!busy} onClick={() => act('confirm', r)} style={{ border: 'none', background: T.good, color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Подтвердить</button>
                      <button data-testid="review-reject" disabled={!!busy} onClick={() => act('reject', r)} style={{ border: `1px solid #F3C6C6`, background: '#fff', color: T.bad, borderRadius: 8, padding: '6px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Отклонить</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {customer ? <Customer360Drawer userId={customer.id} name={customer.name} onClose={() => setCustomer(null)} /> : null}
    </div>
  );
};

/* ─────────────────────────── Calendar ─────────────────────────── */
const CalendarTab: React.FC = () => {
  const tasks = useAsync(() => fetchAdminTasks('earlyland'), []);
  const rows: any[] = (tasks.data || []).filter((r: any) => r.date);
  const byDate = useMemo(() => {
    const m: Record<string, any[]> = {};
    for (const r of rows) {
      const key = new Date(r.date).toLocaleDateString('ru-RU');
      (m[key] = m[key] || []).push(r);
    }
    return m;
  }, [tasks.data]);
  const keys = Object.keys(byDate).sort();
  return (
    <div data-testid="tc-calendar">
      <div style={{ fontSize: 13.5, color: T.sub, marginBottom: 14 }}>Календарь EarlyLand-заданий с датами. Core-задания без даты сюда не попадают.</div>
      {tasks.loading ? <LoadingRow /> : keys.length === 0 ? <Empty text="Нет заданий с датами." /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
          {keys.map((k) => (
            <div key={k} style={{ ...card, padding: 14 }}>
              <div style={{ fontWeight: 800, color: T.ink, marginBottom: 10 }}>{k}</div>
              {byDate[k].map((r) => (
                <div key={r._id} style={{ background: T.soft, border: `1px solid ${T.border}`, borderRadius: 10, padding: 10, marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{r.name}</div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                    <Chip tone="info">+{r.points} XP</Chip>
                    <Chip tone={r.accessTier === 'prime' ? 'warn' : 'default'}>{r.accessTier === 'prime' ? 'Prime' : 'Public'}</Chip>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────── Analytics ─────────────────────────── */
const AnalyticsTab: React.FC = () => {
  const a = useAsync(() => fetchTaskAnalytics(30), []);
  const byDay: any[] = a.data?.byDay || [];
  const top: any[] = a.data?.topTasks || [];
  const maxXp = Math.max(1, ...byDay.map((d) => d.xp || 0));
  return (
    <div data-testid="tc-analytics">
      {a.loading ? <LoadingRow /> : (
        <>
          <div style={{ ...card, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 800, color: T.ink, marginBottom: 14 }}>XP за задания по дням (30 дн)</div>
            {byDay.length === 0 ? <Empty text="Ещё нет данных." /> : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160 }}>
                {byDay.map((d) => (
                  <div key={d.date} title={`${d.date}: ${d.xp} XP / ${d.completions} вып.`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <div style={{ width: '70%', minHeight: 2, height: `${Math.round(((d.xp || 0) / maxXp) * 140)}px`, background: T.accent, borderRadius: 6 }} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={card}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}`, fontWeight: 800, color: T.ink }}>Топ заданий</div>
            {top.length === 0 ? <Empty text="Ещё нет выполнений." /> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Задание</th><th style={th}>Тип</th><th style={th}>Выполнений</th><th style={th}>XP</th></tr></thead>
                <tbody>
                  {top.map((t) => (
                    <tr key={t.taskId}><td style={{ ...td, fontWeight: 700 }}>{t.name}</td><td style={td}>{t.type === 'default' ? 'EarlyLand' : 'Core'}</td><td style={td}>{fmtNum(t.completions)}</td><td style={{ ...td, color: T.accent, fontWeight: 800 }}>{fmtNum(t.xp)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/* ─────────────────────────── Diagnostics (anti-fraud) ─────────────────────────── */
const DiagnosticsTab: React.FC = () => {
  const diag = useAsync(() => fetchDiagnostics(), []);
  const c = diag.data?.counters || {};
  const rows: any[] = diag.data?.rows || [];
  const FLAG_LABEL: Record<string, string> = {
    TOO_FAST: 'Слишком быстро', DUPLICATE_EVIDENCE: 'Дубль доказательства', COMPLETION_BURST: 'Всплеск выполнений', COOLDOWN_ATTEMPT: 'Кулдаун', XP_CAP_REACHED: 'Лимит XP',
  };
  return (
    <div data-testid="tc-diagnostics">
      <div style={{ fontSize: 13.5, color: T.sub, marginBottom: 14 }}>Rule-based anti-farm: подозрительные выполнения помечаются флагами (не авто-reject).</div>
      {diag.loading ? <LoadingRow /> : (
        <>
          <KpiGrid min={150}>
            <KpiCard testId="diag-toofast" label="Слишком быстро" value={fmtNum(c.TOO_FAST)} tone="warn" />
            <KpiCard testId="diag-dup" label="Дубль доказательства" value={fmtNum(c.DUPLICATE_EVIDENCE)} tone="bad" />
            <KpiCard label="Всплеск выполнений" value={fmtNum(c.COMPLETION_BURST)} tone="warn" />
            <KpiCard label="Кулдаун" value={fmtNum(c.COOLDOWN_ATTEMPT)} />
            <KpiCard label="Лимит XP" value={fmtNum(c.XP_CAP_REACHED)} />
            <KpiCard label="Пользователей с флагами" value={fmtNum(diag.data?.usersWithFlags)} tone="bad" />
          </KpiGrid>
          <div style={{ height: 16 }} />
          <div style={card}>
            {rows.length === 0 ? <Empty text="Подозрительной активности не обнаружено." /> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Пользователь</th><th style={th}>Задача</th><th style={th}>Флаги</th><th style={th}>Risk</th><th style={th}>Статус</th></tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} data-testid="diag-row">
                      <td style={td}>{r.user}</td>
                      <td style={td}>{r.task}</td>
                      <td style={td}><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{(r.flags || []).map((f: string) => <Chip key={f} tone="bad">{FLAG_LABEL[f] || f}</Chip>)}</div></td>
                      <td style={{ ...td, fontWeight: 800, color: r.riskScore >= 67 ? T.bad : T.warn }}>{r.riskScore}</td>
                      <td style={td}><Chip tone={r.state === 'completed' ? 'good' : r.state === 'rejected' ? 'bad' : 'warn'}>{r.state}</Chip></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/* ─────────────────────────── Page ─────────────────────────── */
const TaskCenterPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const [tab, setTab] = useState<TabKey>('overview');
  useEffect(() => { document.title = 'FOMO · Задачи'; }, []);

  const inner = (
    <>
      <style>{`::selection{background:${T.accent};color:#fff}`}</style>
      {!embedded ? (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.ink, letterSpacing: -0.3 }}>Задачи</div>
          <div style={{ fontSize: 13.5, color: T.sub, marginTop: 6, maxWidth: 900 }}>
            Управление заданиями пользователей, проверкой выполнения и начислением XP.
          </div>
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: `1px solid ${T.border}`, marginBottom: 24 }} role="tablist">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} data-testid={`tc-tab-${t.key}`} role="tab" aria-selected={tab === t.key}
            style={{ position: 'relative', padding: '11px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 700, border: 'none', background: 'transparent', color: tab === t.key ? T.accent : T.sub, borderBottom: `2px solid ${tab === t.key ? T.accent : 'transparent'}`, marginBottom: -1, whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>
      <div>
        {tab === 'overview' && <OverviewTab />}
        {tab === 'global' && <GlobalTab />}
        {tab === 'review' && <ReviewTab />}
        {tab === 'calendar' && <CalendarTab />}
        {tab === 'analytics' && <AnalyticsTab />}
        {tab === 'diagnostics' && <DiagnosticsTab />}
      </div>
    </>
  );

  if (embedded) return <div data-testid="task-center-page">{inner}</div>;

  return (
    <Layout>
      <div style={{ background: T.pageBg, minHeight: '100%', padding: '28px 28px 48px' }} data-testid="task-center-page">
        {inner}
      </div>
    </Layout>
  );
};

export default TaskCenterPage;
