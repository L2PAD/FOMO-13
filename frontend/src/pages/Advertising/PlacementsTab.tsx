import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { T, Card, SimpleTable, Badge, StateBlock, Column } from '../Statistics/ui';
import { listPlacements, updatePlacement, AdPlacement } from '../../components/services/advertising';
import { num } from './ui';

const groupLabel: Record<string, string> = { global: 'Глобальные (сквозные)', home: 'Главная', local: 'Локальные' };
const qualityTone: Record<string, 'good' | 'warn' | 'bad'> = { ok: 'good', low: 'warn', insufficient: 'bad' };
const qualityLabel: Record<string, string> = { ok: 'Данные ок', low: 'Мало данных', insufficient: 'Нет данных' };

const MODES: { value: string; label: string; hint: string }[] = [
  { value: 'ads', label: 'Реклама', hint: 'Показывать платные баннеры (при отсутствии — форма «Ваша реклама здесь»)' },
  { value: 'form', label: 'Только форма', hint: 'Реклама выключена — всегда показывается форма заявки' },
  { value: 'rotate', label: 'Чередовать', hint: 'Чередовать баннер и форму заявки по таймеру' },
];

const Toggle: React.FC<{ on: boolean; onChange: () => void; testid?: string }> = ({ on, onChange, testid }) => (
  <button onClick={onChange} data-testid={testid} aria-pressed={on}
    style={{ width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer', padding: 2, background: on ? T.good : T.border, transition: 'background 200ms ease', position: 'relative' }}>
    <span style={{ display: 'block', width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transform: on ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 200ms ease' }} />
  </button>
);

const ModeSwitch: React.FC<{ value: string; disabled?: boolean; onChange: (v: string) => void; testidPrefix?: string }> = ({ value, disabled, onChange, testidPrefix }) => (
  <div style={{ display: 'inline-flex', border: `1px solid ${T.border}`, borderRadius: 9, overflow: 'hidden', opacity: disabled ? 0.5 : 1 }}>
    {MODES.map((m) => {
      const active = value === m.value;
      return (
        <button key={m.value} title={m.hint} disabled={disabled} data-testid={testidPrefix ? `${testidPrefix}-${m.value}` : undefined}
          onClick={() => !disabled && onChange(m.value)}
          style={{ padding: '6px 11px', fontSize: 12, fontWeight: 700, cursor: disabled ? 'default' : 'pointer', border: 'none', borderRight: m.value !== 'rotate' ? `1px solid ${T.border}` : 'none', background: active ? T.accent : '#fff', color: active ? '#fff' : T.sub }}>
          {m.label}
        </button>
      );
    })}
  </div>
);

const PlacementsTab: React.FC = () => {
  const [rows, setRows] = useState<AdPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<string>('');

  const load = async () => { setLoading(true); const r = await listPlacements(); if (r.success) setRows(r.data); else setError(true); setLoading(false); };
  useEffect(() => { load(); }, []);

  const patchLocal = (code: string, patch: Partial<AdPlacement>) => setRows((rs) => rs.map((x) => (x.code === code ? { ...x, ...patch } : x)));

  const save = async (p: AdPlacement, patch: any, successMsg?: string) => {
    setBusy(p.code);
    patchLocal(p.code, patch);
    const r = await updatePlacement(p.code, patch);
    setBusy('');
    if (!r.success) { toast.error('Не удалось сохранить настройку плейсмента'); load(); }
    else if (successMsg) toast.success(successMsg);
  };

  const toggle = (p: AdPlacement) => save(p, { enabled: !(p.enabled !== false) }, !(p.enabled !== false) ? `«${p.adminName}» включён` : `«${p.adminName}» выключен`);
  const setMode = (p: AdPlacement, mode: string) => save(p, { mode }, `Режим: ${MODES.find((m) => m.value === mode)?.label}`);

  const RotationInputs: React.FC<{ p: AdPlacement }> = ({ p }) => (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
      <span style={{ fontSize: 11, color: T.faint }}>реклама</span>
      <input type="number" min={3} max={600} defaultValue={p.rotateAdSeconds || 30} data-testid={`rot-ad-${p.code}`}
        onBlur={(e) => save(p, { rotateAdSeconds: Number(e.target.value) || 30 }, 'Тайминг обновлён')}
        style={{ width: 54, padding: '5px 7px', border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 12 }} />
      <span style={{ fontSize: 11, color: T.faint }}>форма</span>
      <input type="number" min={3} max={600} defaultValue={p.rotateFormSeconds || 10} data-testid={`rot-form-${p.code}`}
        onBlur={(e) => save(p, { rotateFormSeconds: Number(e.target.value) || 10 }, 'Тайминг обновлён')}
        style={{ width: 54, padding: '5px 7px', border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 12 }} />
      <span style={{ fontSize: 11, color: T.faint }}>сек</span>
    </div>
  );

  const columns: Column<AdPlacement>[] = [
    { key: 'name', header: 'Плейсмент', render: (r) => (
      <div><div style={{ fontWeight: 700, color: T.ink }}>{r.adminName}</div>
        <div style={{ fontSize: 11, color: T.faint }}>{r.route}{r.legacy ? ` · legacy: ${r.legacy}` : ''}</div></div>) },
    { key: 'group', header: 'Уровень', render: (r) => <Badge tone={r.group === 'global' ? 'info' : 'default'}>{groupLabel[r.group] || r.group}</Badge> },
    { key: 'mode', header: 'Что показывать', render: (r) => (
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, opacity: r.enabled === false || busy === r.code ? 0.55 : 1 }}>
        <ModeSwitch value={r.mode || 'ads'} disabled={r.enabled === false} onChange={(v) => setMode(r, v)} testidPrefix={`mode-${r.code}`} />
        {(r.mode || 'ads') === 'rotate' ? <RotationInputs p={r} /> : null}
      </div>) },
    { key: 'inv', header: 'Инвентарь/день', align: 'right', render: (r) => (
      <span>{num(r.live.estimatedInventoryPerDay)} {r.live.inventoryIsBaseline ? <span style={{ fontSize: 10, color: T.warn, fontWeight: 700 }}>(baseline)</span> : null}</span>) },
    { key: 'comp', header: 'Кампаний', align: 'right', render: (r) => num(r.live.competingCampaigns) },
    { key: 'q', header: 'Качество', render: (r) => <Badge tone={qualityTone[r.live.dataQuality] || 'default'}>{qualityLabel[r.live.dataQuality] || r.live.dataQuality}</Badge> },
    { key: 'on', header: 'Активен', align: 'right', render: (r) => (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, opacity: busy === r.code ? 0.6 : 1 }}>
        <span style={{ fontSize: 11.5, color: r.enabled !== false ? T.good : T.faint, fontWeight: 700 }}>{r.enabled !== false ? 'Вкл' : 'Выкл'}</span>
        <Toggle on={r.enabled !== false} onChange={() => toggle(r)} testid={`placement-toggle-${r.code}`} />
      </div>) },
  ];

  const hero = rows.find((r) => r.code === 'GLOBAL_TOP_BANNER');

  return (
    <div data-testid="ads-placements">
      {/* Quick control for the homepage sweeping top banner */}
      {hero ? (
        <Card style={{ padding: 18, marginBottom: 16, background: 'linear-gradient(180deg,#F6F4FF,#FFFFFF)', border: `1px solid ${T.border}` }} data-testid="homepage-banner-control">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>Верхний баннер на сайте (правый верхний угол)</div>
              <div style={{ fontSize: 12.5, color: T.sub, marginTop: 4, maxWidth: 560 }}>Управляйте тем, что видит посетитель в сквозном верхнем баннере: показывать рекламу, показывать только форму «Ваша реклама здесь», либо чередовать их по таймеру. Изменения применяются на сайте сразу.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: busy === hero.code ? 0.6 : 1 }}>
              <Toggle on={hero.enabled !== false} onChange={() => toggle(hero)} testid="homepage-banner-enabled" />
              <span style={{ fontSize: 12, fontWeight: 700, color: hero.enabled !== false ? T.good : T.faint }}>{hero.enabled !== false ? 'Активен' : 'Выключен'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            <ModeSwitch value={hero.mode || 'ads'} disabled={hero.enabled === false} onChange={(v) => setMode(hero, v)} testidPrefix="homepage-mode" />
            {(hero.mode || 'ads') === 'rotate' ? <RotationInputs p={hero} /> : null}
            <span style={{ fontSize: 11.5, color: T.faint }}>{MODES.find((m) => m.value === (hero.mode || 'ads'))?.hint}</span>
          </div>
        </Card>
      ) : null}

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: T.sub }}>Единый реестр рекламных поверхностей (source of truth). Для каждой поверхности можно задать, что показывать: <b>Реклама</b>, <b>Только форма</b> заявки или <b>Чередование</b>. Инвентарь считается по реальной истории; при нехватке данных показывается помеченная <b>baseline</b>-оценка.</div>
      </Card>
      <Card style={{ padding: 8 }}>
        {loading ? <div style={{ padding: 16 }}><StateBlock kind="loading" /></div>
          : error ? <StateBlock kind="error" message="Не удалось загрузить плейсменты" />
          : <SimpleTable testId="placements-table" columns={columns} rows={rows} empty="Нет плейсментов" />}
      </Card>
    </div>
  );
};

export default PlacementsTab;
