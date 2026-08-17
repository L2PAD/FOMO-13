import React, { useEffect, useState } from 'react';
import { T } from '../Statistics/ui';
import { AdminSelect } from '../AdminRating/AdminControls';
import { getMembershipsPageCms, saveMembershipsPageCms } from './service';

const card: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 16 };
const label: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6, display: 'block' };
const input: React.CSSProperties = { width: '100%', border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13.5, color: T.ink, marginBottom: 12, boxSizing: 'border-box' };
const area: React.CSSProperties = { ...input, minHeight: 64, resize: 'vertical', fontFamily: 'inherit' };
const btn = (bg: string): React.CSSProperties => ({ background: bg, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' });
const smallBtn: React.CSSProperties = { background: '#fff', color: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const sub: React.CSSProperties = { fontSize: 12.5, color: T.sub, marginBottom: 14, lineHeight: 1.5 };
const title: React.CSSProperties = { fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 4 };

const ICONS = ['sparkles', 'analytics', 'rocket', 'shield'];

export const SellingPageTab: React.FC = () => {
  const [cfg, setCfg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => { setLoading(true); getMembershipsPageCms().then((r) => setCfg(r.config)).catch(() => setMsg('Ошибка загрузки')).finally(() => setLoading(false)); };
  useEffect(load, []);

  const set = (k: string, v: any) => setCfg((c: any) => ({ ...c, [k]: v }));
  const setVP = (i: number, k: string, v: string) => setCfg((c: any) => { const a = [...(c.valueProps || [])]; a[i] = { ...a[i], [k]: v }; return { ...c, valueProps: a }; });
  const setFaq = (i: number, k: string, v: string) => setCfg((c: any) => { const a = [...(c.faq || [])]; a[i] = { ...a[i], [k]: v }; return { ...c, faq: a }; });
  const addVP = () => setCfg((c: any) => ({ ...c, valueProps: [...(c.valueProps || []), { icon: 'sparkles', title: '', text: '' }] }));
  const delVP = (i: number) => setCfg((c: any) => ({ ...c, valueProps: (c.valueProps || []).filter((_: any, x: number) => x !== i) }));
  const addFaq = () => setCfg((c: any) => ({ ...c, faq: [...(c.faq || []), { q: '', a: '' }] }));
  const delFaq = (i: number) => setCfg((c: any) => ({ ...c, faq: (c.faq || []).filter((_: any, x: number) => x !== i) }));

  const save = async () => {
    setSaving(true); setMsg('');
    try { const r = await saveMembershipsPageCms(cfg); setCfg(r.config); setMsg('Сохранено ✓'); }
    catch (e: any) { setMsg(e.message || 'Ошибка сохранения'); }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  if (loading || !cfg) return <div style={{ ...card, color: T.sub }}>Загрузка…</div>;

  return (
    <div data-testid="selling-page-tab">
      <div style={{ ...card, background: '#F5FBF9', borderColor: '#B7E6D8' }}>
        <div style={title}>Продающая страница /utility/memberships</div>
        <div style={sub}>Контент витрины продаж. Сами продукты и цены — во вкладке «Тарифы» (Product CMS). Здесь — маркетинговая обёртка страницы: hero, преимущества, FAQ, NFT-оффер. Ссылку можно использовать в рекламе и как лендинг для трафика.</div>
        <a href="/utility/memberships" target="_blank" rel="noreferrer" style={{ ...smallBtn, display: 'inline-block', textDecoration: 'none', color: T.accent, borderColor: T.accent }}>Открыть страницу ↗</a>
      </div>

      <div style={card}>
        <div style={title}>Hero</div>
        <label style={label}>Бейдж</label>
        <input style={input} value={cfg.heroBadge || ''} onChange={(e) => set('heroBadge', e.target.value)} data-testid="sp-heroBadge" />
        <label style={label}>Заголовок</label>
        <input style={input} value={cfg.heroTitle || ''} onChange={(e) => set('heroTitle', e.target.value)} data-testid="sp-heroTitle" />
        <label style={label}>Подзаголовок / описание страницы</label>
        <textarea style={area} value={cfg.heroSubtitle || ''} onChange={(e) => set('heroSubtitle', e.target.value)} data-testid="sp-heroSubtitle" />
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={title}>Преимущества (value props)</div>
          <button style={smallBtn} onClick={addVP}>+ Добавить</button>
        </div>
        {(cfg.valueProps || []).map((v: any, i: number) => (
          <div key={i} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 150, flexShrink: 0 }}>
                <AdminSelect
                  value={v.icon}
                  options={ICONS.map((ic) => ({ value: ic, label: ic }))}
                  onChange={(val) => setVP(i, 'icon', val)}
                  ariaLabel="Иконка преимущества"
                  testid={`vp-icon-${i}`}
                />
              </div>
              <div style={{ flex: 1 }}>
                <input style={{ ...input, marginBottom: 8 }} placeholder="Заголовок" value={v.title} onChange={(e) => setVP(i, 'title', e.target.value)} />
                <input style={{ ...input, marginBottom: 0 }} placeholder="Текст" value={v.text} onChange={(e) => setVP(i, 'text', e.target.value)} />
              </div>
              <button style={{ ...smallBtn, color: T.bad, borderColor: T.bad }} onClick={() => delVP(i)}>✕</button>
            </div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={title}>NFT-оффер (вторичный)</div>
        <label style={label}>Заголовок</label>
        <input style={input} value={cfg.nftOfferTitle || ''} onChange={(e) => set('nftOfferTitle', e.target.value)} />
        <label style={label}>Текст</label>
        <textarea style={area} value={cfg.nftOfferText || ''} onChange={(e) => set('nftOfferText', e.target.value)} />
        <label style={label}>CTA</label>
        <input style={input} value={cfg.nftOfferCta || ''} onChange={(e) => set('nftOfferCta', e.target.value)} />
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={title}>FAQ</div>
          <button style={smallBtn} onClick={addFaq}>+ Добавить</button>
        </div>
        <label style={label}>Заголовок секции</label>
        <input style={input} value={cfg.faqTitle || ''} onChange={(e) => set('faqTitle', e.target.value)} />
        {(cfg.faq || []).map((f: any, i: number) => (
          <div key={i} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <input style={{ ...input, marginBottom: 8 }} placeholder="Вопрос" value={f.q} onChange={(e) => setFaq(i, 'q', e.target.value)} />
                <textarea style={{ ...area, minHeight: 48, marginBottom: 0 }} placeholder="Ответ" value={f.a} onChange={(e) => setFaq(i, 'a', e.target.value)} />
              </div>
              <button style={{ ...smallBtn, color: T.bad, borderColor: T.bad }} onClick={() => delFaq(i)}>✕</button>
            </div>
          </div>
        ))}
      </div>

      <div style={card}>
        <label style={label}>Footnote</label>
        <input style={input} value={cfg.footnote || ''} onChange={(e) => set('footnote', e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button style={btn(T.accent)} onClick={save} disabled={saving} data-testid="sp-save">{saving ? 'Сохранение…' : 'Сохранить'}</button>
        <button style={smallBtn} onClick={load}>Сбросить</button>
        {msg ? <span style={{ fontSize: 13, fontWeight: 700, color: msg.includes('✓') ? T.good : T.bad }}>{msg}</span> : null}
      </div>
    </div>
  );
};
