import React from 'react';
import { useHistory } from 'react-router-dom';
import { T, useAsync, fmtNum } from '../Statistics/ui';
import { fetchAdminTasks } from '../../components/services/taskCenter';

const MODE_LABEL: Record<string, string> = {
  AUTO_METRIC: 'Автоматически',
  USER_CLAIM: 'Клейм',
  MODERATOR_REVIEW: 'Проверка',
  EXTERNAL_ACTION: 'Внешнее действие',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Активно',
  draft: 'Черновик',
  archived: 'Архив',
  paused: 'Пауза',
};

const card: React.CSSProperties = { background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' };
const th: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 800, color: T.faint, textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: `1px solid ${T.border}`, background: T.soft, whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '10px 12px', fontSize: 13, color: T.ink, borderBottom: `1px solid ${T.border}` };

const Stat: React.FC<{ label: string; value: React.ReactNode; tone?: string }> = ({ label, value, tone }) => (
  <div style={{ flex: '1 1 120px', background: T.soft, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
    <div style={{ fontSize: 22, fontWeight: 800, color: tone || T.ink }}>{value}</div>
    <div style={{ fontSize: 11.5, color: T.sub, marginTop: 2 }}>{label}</div>
  </div>
);

const Chip: React.FC<{ tone?: string; children: React.ReactNode }> = ({ tone = 'default', children }) => {
  const map: Record<string, { bg: string; fg: string }> = {
    good: { bg: '#E7F6F3', fg: T.good }, warn: { bg: '#FEF3E2', fg: T.warn }, info: { bg: '#EEF2FF', fg: T.accent }, default: { bg: T.soft, fg: T.sub },
  };
  const c = map[tone] || map.default;
  return <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: c.bg, color: c.fg }}>{children}</span>;
};

/**
 * P2 — "Задания активности" section for the ActivityEditor. Works ONLY through
 * the canonical Task API (tasks linked via v2ActivityId). It does NOT create a
 * second task editor — the CTAs deep-link into the shared Task Center.
 */
export const ActivityTasksSection: React.FC<{ activityId: string }> = ({ activityId }) => {
  const history = useHistory();
  const tasks = useAsync(() => fetchAdminTasks('earlyland', activityId), [activityId]);
  const rows: any[] = tasks.data || [];

  const totalXp = rows.reduce((s, r) => s + Number(r.points || 0), 0);
  const started = rows.reduce((s, r) => s + Number(r.counts?.inProgress || 0) + Number(r.counts?.underReview || 0) + Number(r.counts?.completed || 0), 0);
  const completed = rows.reduce((s, r) => s + Number(r.counts?.completed || 0), 0);
  const published = rows.filter((r) => r.taskStatus === 'active').length;
  const drafts = rows.filter((r) => r.taskStatus === 'draft').length;
  const archived = rows.filter((r) => r.taskStatus === 'archived').length;
  const prime = rows.filter((r) => r.accessTier === 'prime').length;
  const rate = started > 0 ? Math.round((completed / started) * 100) : 0;

  const goCenter = () => history.push(`/early_land/tasks?activity=${activityId}`);

  return (
    <div data-testid="activity-tasks-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>Задания активности</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button data-testid="activity-create-task" onClick={goCenter} style={{ border: 'none', background: T.accent, color: '#fff', fontWeight: 700, fontSize: 13, padding: '9px 14px', borderRadius: 10, cursor: 'pointer' }}>+ Создать задание</button>
          <button data-testid="activity-open-center" onClick={goCenter} style={{ border: `1px solid ${T.border}`, background: '#fff', color: T.ink, fontWeight: 700, fontSize: 13, padding: '9px 14px', borderRadius: 10, cursor: 'pointer' }}>Открыть в «Задачах»</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <Stat label="Всего заданий" value={fmtNum(rows.length)} />
        <Stat label="Опубликовано" value={fmtNum(published)} tone={T.good} />
        <Stat label="Черновики" value={fmtNum(drafts)} />
        <Stat label="Архив" value={fmtNum(archived)} />
        <Stat label="Prime" value={fmtNum(prime)} tone={T.warn} />
        <Stat label="Потенц. XP" value={fmtNum(totalXp)} tone={T.accent} />
        <Stat label="Начали" value={fmtNum(started)} />
        <Stat label="Завершили" value={fmtNum(completed)} tone={T.good} />
        <Stat label="Завершаемость" value={`${rate}%`} />
      </div>

      <div style={card}>
        {tasks.loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: T.sub }}>Загрузка…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: T.faint, fontSize: 13.5 }}>
            К этой активности пока не привязано ни одного задания. Нажмите «Создать задание».
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Задание</th><th style={th}>XP</th><th style={th}>Проверка</th><th style={th}>Доступ</th><th style={th}>Выполнили</th><th style={th}>Статус</th><th style={th}></th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} data-testid="activity-task-row">
                  <td style={{ ...td, fontWeight: 700 }}>{r.name}</td>
                  <td style={{ ...td, color: T.accent, fontWeight: 800 }}>+{fmtNum(r.points)}</td>
                  <td style={td}><Chip tone={r.completionMode === 'AUTO_METRIC' ? 'info' : 'default'}>{MODE_LABEL[r.completionMode] || r.completionMode}</Chip></td>
                  <td style={td}><Chip tone={r.accessTier === 'prime' ? 'warn' : 'default'}>{r.accessTier === 'prime' ? 'Prime' : 'Public'}</Chip></td>
                  <td style={td}>{fmtNum(r.counts?.completed)}</td>
                  <td style={td}><Chip tone={r.taskStatus === 'active' ? 'good' : 'default'}>{STATUS_LABEL[r.taskStatus] || r.taskStatus}</Chip></td>
                  <td style={td}><button onClick={goCenter} style={{ border: `1px solid ${T.border}`, background: '#fff', color: T.accent, borderRadius: 8, padding: '5px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>Открыть</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ActivityTasksSection;
