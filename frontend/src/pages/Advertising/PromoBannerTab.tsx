import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { T } from '../Statistics/ui';
import { field, label, primaryBtn } from './ui';
import fetchBanner from '../../components/services/layout/fetchBanner';
import updatePromo from '../../components/services/layout/updatePromo';
import OptionSelect from './OptionSelect';

/**
 * Промо-баннер продуктов — управляет двумя плашками в шапке публичного сайта:
 *   • FOMO AI    — зелёная, иконка бота, ведёт на ВНУТРЕННЮЮ вкладку (покупка пакетов / AI)
 *   • FOMO Intel — ЧЁРНАЯ, иконка графика, ведёт на ВНЕШНИЙ сервис (настраиваемый URL)
 * Оператор выбирает, что показывать (обе / только AI / только Intel) и период чередования.
 */

type Mode = 'both' | 'ai' | 'intel';
interface Pill { enabled: boolean; label: string; subtitle: string; url: string; }
interface Promo { mode: Mode; rotateSeconds: number; ai: Pill; intel: Pill; }

const DEFAULT: Promo = {
  mode: 'both',
  rotateSeconds: 10,
  ai: { enabled: true, label: 'FOMO AI', subtitle: 'Your crypto research copilot', url: '/utility/ai' },
  intel: { enabled: true, label: 'FOMO Intel', subtitle: 'Pro-grade market intelligence', url: 'https://i.fomo.cx/' },
};

const card: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 };

const PillPreview: React.FC<{ tone: 'green' | 'black'; icon: 'bot' | 'chart'; text: string }> = ({ tone, icon, text }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, fontWeight: 700, fontSize: 13.5,
    background: tone === 'green' ? '#E7F7F1' : '#0B1220',
    color: tone === 'green' ? '#04A584' : '#fff',
    border: tone === 'green' ? '1px solid #B8E9DA' : '1px solid #0B1220',
  }}>
    {icon === 'bot' ? (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="8" width="16" height="12" rx="3" /><path d="M12 8V4" /><circle cx="9" cy="14" r="1.2" fill="currentColor" /><circle cx="15" cy="14" r="1.2" fill="currentColor" /><path d="M2 13v2M22 13v2" /></svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 14l3.5-3.5 2.5 2.5 5-5" /></svg>
    )}
    {text}
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75 }}><path d="M7 17L17 7" /><path d="M8 7h9v9" /></svg>
  </span>
);

const PillEditor: React.FC<{ title: string; tone: 'green' | 'black'; icon: 'bot' | 'chart'; hint: string; pill: Pill; onChange: (p: Pill) => void; testid: string }>
  = ({ title, tone, icon, hint, pill, onChange, testid }) => (
    <div style={card} data-testid={testid}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{title}</div>
        <PillPreview tone={tone} icon={icon} text={pill.label || title} />
      </div>
      <div style={{ fontSize: 12.5, color: T.sub, marginBottom: 14, lineHeight: '18px' }}>{hint}</div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: T.ink }}>
        <input type="checkbox" checked={pill.enabled} onChange={(e) => onChange({ ...pill, enabled: e.target.checked })} data-testid={`${testid}-enabled`} style={{ width: 18, height: 18, accentColor: T.accent, cursor: 'pointer' }} />
        Плашка активна
      </label>
      <label style={label}>Заголовок плашки</label>
      <input style={{ ...field, marginBottom: 12 }} value={pill.label} maxLength={40} onChange={(e) => onChange({ ...pill, label: e.target.value })} data-testid={`${testid}-label`} />
      <label style={label}>Подпись (в поповере)</label>
      <input style={{ ...field, marginBottom: 12 }} value={pill.subtitle} maxLength={120} onChange={(e) => onChange({ ...pill, subtitle: e.target.value })} data-testid={`${testid}-subtitle`} />
      <label style={label}>{tone === 'black' ? 'Внешний URL (открывается в новой вкладке)' : 'Внутренний путь (напр. /utility/ai)'}</label>
      <input style={field} value={pill.url} placeholder={tone === 'black' ? 'https://i.fomo.cx/' : '/utility/ai'} onChange={(e) => onChange({ ...pill, url: e.target.value })} data-testid={`${testid}-url`} />
    </div>
  );

const PromoBannerTab: React.FC = () => {
  const [promo, setPromo] = useState<Promo>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBanner().then(({ data }) => {
      if (data?.promo) setPromo({ ...DEFAULT, ...data.promo, ai: { ...DEFAULT.ai, ...data.promo.ai }, intel: { ...DEFAULT.intel, ...data.promo.intel } });
      else if (typeof data?.intelUrl === 'string') setPromo((p) => ({ ...p, intel: { ...p.intel, url: data.intelUrl } }));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    const r = await updatePromo(promo);
    setSaving(false);
    if (r.success) toast.success('Промо-баннер сохранён'); else toast.error('Не удалось сохранить');
  };

  if (loading) return <div style={{ padding: 24, color: T.sub }}>Загрузка…</div>;

  return (
    <div data-testid="promo-banner-tab" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={card}>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.ink, marginBottom: 6 }}>Промо-баннер продуктов</div>
        <div style={{ fontSize: 13, color: T.sub, lineHeight: '19px', marginBottom: 18 }}>
          Две плашки в шапке сайта: <b style={{ color: '#04A584' }}>FOMO AI</b> (зелёная, ведёт на покупку пакетов внутри сайта) и <b>FOMO Intel</b> (чёрная, внешний сервис аналитики). Выберите, что показывать и как часто чередовать.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
          <OptionSelect
            label="Что показывать"
            testid="promo-mode"
            value={promo.mode}
            onChange={(v) => setPromo({ ...promo, mode: v as Mode })}
            options={[
              { value: 'both', label: 'Обе плашки (чередование)' },
              { value: 'ai', label: 'Только FOMO AI (зелёная)' },
              { value: 'intel', label: 'Только FOMO Intel (чёрная)' },
            ]}
          />
          <div style={{ opacity: promo.mode === 'both' ? 1 : 0.5, pointerEvents: promo.mode === 'both' ? 'auto' : 'none' }}>
            <OptionSelect
              label="Интервал чередования"
              testid="promo-rotate"
              value={String(promo.rotateSeconds)}
              onChange={(v) => setPromo({ ...promo, rotateSeconds: Number(v) })}
              options={[
                { value: '5', label: 'Каждые 5 секунд' },
                { value: '10', label: 'Каждые 10 секунд' },
                { value: '15', label: 'Каждые 15 секунд' },
              ]}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
        <PillEditor testid="promo-ai" title="FOMO AI" tone="green" icon="bot"
          hint="Внутренний продукт: AI-чат, портфолио-агент, EarlyLand. Ведёт на вкладку покупки пакетов/подписки внутри сайта."
          pill={promo.ai} onChange={(ai) => setPromo({ ...promo, ai })} />
        <PillEditor testid="promo-intel" title="FOMO Intel" tone="black" icon="chart"
          hint="Внешний сервис: анализ крипторынка (on-chain, sentiment, фракталы, M-Brain prediction, TA). Ведёт на отдельный сайт."
          pill={promo.intel} onChange={(intel) => setPromo({ ...promo, intel })} />
      </div>

      <div>
        <button style={{ ...primaryBtn, padding: '12px 24px', opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={save} data-testid="promo-save">
          {saving ? 'Сохранение…' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
};

export default PromoBannerTab;
