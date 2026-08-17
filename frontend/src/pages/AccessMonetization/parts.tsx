import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { T } from '../Statistics/ui';
import { AdminSelect } from '../AdminRating/AdminControls';
import * as api from './service';
import { capName, sourceLabel, reasonLabel, CAP_BACKEND, subSourceLabel, DURATION_PRESETS, REASON_PRESETS } from './labels';

/* ---------- shared styles ---------- */
export const card: React.CSSProperties = { background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 20 };
export const label: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 6, display: 'block' };
export const hint: React.CSSProperties = { fontSize: 12.5, color: T.sub, marginTop: 6 };
export const th: React.CSSProperties = { textAlign: 'left', fontSize: 12, color: T.sub, fontWeight: 700, padding: '10px 12px', borderBottom: `1px solid ${T.border}`, textTransform: 'uppercase' };
export const td: React.CSSProperties = { fontSize: 13, color: T.ink, padding: '10px 12px', borderBottom: `1px solid ${T.border}`, verticalAlign: 'top' };
export const input: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 13, background: '#fff', color: T.ink, boxSizing: 'border-box' };
export const btn = (tone: 'primary' | 'ghost' | 'danger' = 'primary'): React.CSSProperties => ({ border: tone === 'ghost' ? `1px solid ${T.border}` : 'none', background: tone === 'primary' ? T.accent : tone === 'danger' ? '#DC2626' : '#fff', color: tone === 'ghost' ? T.ink : '#fff', fontWeight: 700, fontSize: 13, padding: '9px 16px', borderRadius: 10, cursor: 'pointer' });
const badge = (bg: string, color: string): React.CSSProperties => ({ display: 'inline-block', padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: bg, color });
const keySmall: React.CSSProperties = { fontSize: 11, color: T.sub, fontFamily: 'monospace' };
const fmt = (v?: string | null) => (v ? new Date(v).toLocaleDateString('ru-RU') : '—');
const money = (v: any) => (v === null || v === undefined ? '—' : `$${v}`);
const drawerWrap: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', justifyContent: 'flex-end', zIndex: 50 };
const drawerBody: React.CSSProperties = { width: 460, maxWidth: '92vw', background: '#fff', height: '100%', padding: 24, overflowY: 'auto' };

const typeBadge = (t: string) => {
  if (t === 'EXTERNAL_ELIGIBILITY') return <span style={badge('#FEF3C7', '#B45309')}>External eligibility</span>;
  if (t === 'HYBRID') return <span style={badge('#EDE9FE', '#6D28D9')}>Hybrid</span>;
  return <span style={badge('#DBEAFE', '#1D4ED8')}>Access</span>;
};
const statusBadge = (s: string) => { const m: any = { ACTIVE: ['#D1FAE5', '#059669'], EXPIRED: ['#F1F5F9', '#64748B'], GRACE_PERIOD: ['#FEF3C7', '#B45309'], CANCELLED: ['#FEE2E2', '#DC2626'], REVOKED: ['#FEE2E2', '#DC2626'], PENDING: ['#DBEAFE', '#1D4ED8'] }; const c = m[s] || ['#F1F5F9', '#64748B']; return <span style={badge(c[0], c[1])}>{s}</span>; };

/* =================== ОБЗОР =================== */
export const OverviewTab: React.FC = () => {
  const [d, setD] = useState<any>(null);
  useEffect(() => { api.getOverview().then(setD).catch(() => toast.error('Не удалось загрузить обзор')); }, []);
  const kpis: { label: string; value: any; note?: string }[] = [
    { label: 'Активные подписки', value: d?.activeSubscriptions ?? '…' },
    { label: 'Активные доступы', value: d?.activeEntitlements ?? '…' },
    { label: 'Ручные доступы', value: d?.manualGrants ?? '…' },
    { label: 'NFT-привилегии', value: d?.nftDerivedEntitlements ?? '…' },
    { label: 'Активных тарифов', value: d?.activePlans ?? '…' },
    { label: 'Правил AI-кредитов', value: d?.creditRules ?? '…' },
    { label: 'Истекают ≤7 дней', value: d?.expiringSoon ?? '…' },
    { label: 'MRR', value: money(d?.mrrUsd), note: 'нет реального checkout' },
    { label: 'AI credits выдано', value: d?.aiCreditsGranted ?? '—', note: 'нет данных' },
    { label: 'AI credits потрачено', value: d?.aiCreditsConsumed ?? '—', note: 'нет данных' },
    { label: 'AI COGS', value: money(d?.aiCogsUsd), note: 'нет данных' },
    { label: 'Gross margin', value: d?.grossMarginPct ?? '—', note: 'нет данных' },
  ];
  return (
    <div>
      <div style={{ ...hint, marginBottom: 14 }}>Сводка коммерческого слоя. Финансовые метрики появятся после подключения реального checkout и AI-usage — сейчас «—».</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 14 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ ...card, marginBottom: 0, padding: 16 }}>
            <div style={{ fontSize: 12.5, color: T.sub, fontWeight: 700 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: T.ink, marginTop: 6 }}>{String(k.value)}</div>
            {k.note ? <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{k.note}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
};

/* =================== ТАРИФЫ (два продукта) =================== */
const PT_BADGE = (t?: string) => t === 'FOMO_INTEL'
  ? <span style={badge('#E0F2FE', '#0369A1')}>FOMO Intel</span>
  : <span style={badge('#EDE9FE', '#6D28D9')}>FOMO AI</span>;

export const PlansTab: React.FC = () => {
  const [plans, setPlans] = useState<api.Plan[]>([]);
  const [caps, setCaps] = useState<api.Capability[]>([]);
  const [edit, setEdit] = useState<api.Plan | null>(null);
  const [preview, setPreview] = useState<api.Plan | null>(null);
  const [saving, setSaving] = useState(false);
  const [newCap, setNewCap] = useState('');
  const load = () => api.getPlans().then((r) => setPlans(r.items)).catch(() => toast.error('Ошибка загрузки тарифов'));
  useEffect(() => { load(); api.getCapabilities().then((r) => setCaps(r.items)).catch(() => undefined); }, []);

  const save = async () => {
    if (!edit) return; setSaving(true);
    try {
      const isIntel = edit.productType === 'FOMO_INTEL';
      await api.upsertPlan({
        ...edit,
        priceUsd: Number(edit.priceUsd),
        durationDays: Number(edit.durationDays),
        aiCreditsIncluded: isIntel ? 0 : Number(edit.aiCredits ?? edit.aiCreditsIncluded ?? 0),
        aiCredits: isIntel ? null : Number(edit.aiCredits ?? edit.aiCreditsIncluded ?? 0),
      });
      toast.success('Продукт сохранён (версия увеличена)'); setEdit(null); load();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const remove = async (p: api.Plan) => {
    const ok = window.confirm(`Удалить тариф «${p.name}» (${p.code}) без возможности восстановления?\n\nЕсли по тарифу есть активные подписки или незавершённые покупки — удаление будет заблокировано (используйте «Архив»).`);
    if (!ok) return;
    try {
      const r = await api.deletePlan(p.code);
      if (r?.ok) { toast.success(`Тариф «${p.name}» удалён`); setEdit(null); load(); }
      else toast.error(r?.error || 'Не удалось удалить тариф');
    } catch (e: any) { toast.error(e?.message || 'Не удалось удалить тариф'); }
  };

  const active = plans.filter((p) => p.status === 'ACTIVE' && (p.productType === 'FOMO_AI' || p.productType === 'FOMO_INTEL'));
  const legacy = plans.filter((p) => p.status !== 'ACTIVE');

  const patchOffer = (i: number, patch: Partial<api.OfferItem>) => {
    if (!edit) return; const items = [...(edit.offerItems || [])]; items[i] = { ...items[i], ...patch }; setEdit({ ...edit, offerItems: items });
  };

  return (
    <div data-testid="plans-tab">
      <div style={{ ...hint, marginBottom: 12 }}>Ровно <b>два продаваемых продукта</b>: <b>FOMO AI</b> (с AI-кредитами) и <b>FOMO Intel</b> (только доступ, без кредитов). Старые Starter/Pro/Research — архив, не продаются. Всё редактируется здесь (не в коде).</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
        {active.map((p) => (
          <div key={p.code} style={{ ...card, marginBottom: 0, border: p.recommended ? `2px solid ${T.accent}` : card.border }} data-testid={`product-card-${p.productType}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.ink }}>{p.name}</div>
              {PT_BADGE(p.productType)}
            </div>
            <div style={{ fontSize: 13, color: T.sub, marginTop: 2 }}>{p.subtitle || ''}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: T.accent, margin: '8px 0' }}>${p.priceUsd}<span style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>/{p.durationDays} дней</span></div>
            <div style={{ ...hint, marginTop: 0 }}>{p.productType === 'FOMO_INTEL' ? 'Без AI-кредитов (доступ)' : `${p.aiCredits ?? p.aiCreditsIncluded} AI-кредитов`} · v{p.version}</div>
            {p.description ? <div style={{ fontSize: 13, color: T.ink, marginTop: 10, lineHeight: '19px', background: '#F8FAFC', border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }} data-testid={`product-desc-${p.productType}`}>{p.description}</div> : <div style={{ ...hint, marginTop: 10, fontStyle: 'italic' }}>Описание не заполнено — добавьте его в редакторе.</div>}
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, marginTop: 12 }}>Преимущества</div>
            <div style={{ marginTop: 6 }}>
              {(p.offerItems || []).filter((o) => o.active !== false).length === 0 ? <div style={{ ...hint, marginTop: 0 }}>Пунктов пока нет.</div> :
                (p.offerItems || []).filter((o) => o.active !== false).map((o, i) => (
                  <div key={i} style={{ padding: '4px 0', display: 'flex', gap: 8 }}>
                    <span style={{ color: '#059669', fontWeight: 800, lineHeight: '18px' }}>✓</span>
                    <div><div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{o.title}</div>{o.description ? <div style={{ fontSize: 12, color: T.sub }}>{o.description}</div> : null}</div>
                  </div>
                ))}
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {statusBadge(p.status)}
              <span style={badge(p.checkoutConfig?.enabled ? '#D1FAE5' : '#FEF3C7', p.checkoutConfig?.enabled ? '#059669' : '#B45309')}>Checkout: {p.checkoutConfig?.enabled ? 'CONNECTED' : 'NOT CONNECTED'}</span>
              <button style={btn('ghost')} data-testid={`product-preview-${p.productType}`} onClick={() => setPreview(p)}>Как видит пользователь</button>
              <button style={btn('ghost')} data-testid={`product-edit-${p.productType}`} onClick={() => setEdit({ ...p })}>Редактировать</button>
              <button style={btn('danger')} data-testid={`product-delete-${p.code}`} onClick={() => remove(p)}>Удалить</button>
            </div>
          </div>
        ))}
      </div>

      {legacy.length ? (
        <div style={{ ...card, marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.ink }}>Legacy (архив — не продаётся)</div>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {legacy.map((p) => <span key={p.code} style={badge('#F1F5F9', '#64748B')}>{p.name} · ${p.priceUsd} · {p.status}</span>)}
          </div>
        </div>
      ) : null}

      {edit ? (
        <div style={drawerWrap} onClick={() => setEdit(null)}>
          <div style={drawerBody} onClick={(e) => e.stopPropagation()} data-testid="product-editor">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>{edit.name}</div>{PT_BADGE(edit.productType)}
            </div>
            <div style={keySmall}>{edit.code}</div>

            <div style={{ fontSize: 13, fontWeight: 800, color: T.accent, marginTop: 18 }}>Основное</div>
            <label style={{ ...label, marginTop: 8 }}>Название</label>
            <input style={input} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <label style={{ ...label, marginTop: 10 }}>Подзаголовок</label>
            <input style={input} value={edit.subtitle || ''} onChange={(e) => setEdit({ ...edit, subtitle: e.target.value })} />
            <label style={{ ...label, marginTop: 10 }}>Описание</label>
            <textarea style={{ ...input, resize: 'vertical' }} rows={2} value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />

            <div style={{ fontSize: 13, fontWeight: 800, color: T.accent, marginTop: 18 }}>Оплата</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
              <div><label style={label}>Цена $</label><input style={input} type="number" value={edit.priceUsd} onChange={(e) => setEdit({ ...edit, priceUsd: e.target.value as any })} /></div>
              <div><label style={label}>Период (дней)</label><input style={input} type="number" value={edit.durationDays} onChange={(e) => setEdit({ ...edit, durationDays: e.target.value as any })} /></div>
            </div>
            <div style={{ ...hint }}>Checkout: <b>{edit.checkoutConfig?.enabled ? 'CONNECTED' : 'NOT CONNECTED'}</b> (реальная оплата ещё не подключена — mock не используется).</div>

            {edit.productType !== 'FOMO_INTEL' ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.accent, marginTop: 18 }}>AI-кредиты</div>
                <label style={{ ...label, marginTop: 8 }}>Кредитов / период</label>
                <input style={input} type="number" data-testid="product-credits" value={edit.aiCredits ?? edit.aiCreditsIncluded ?? 0} onChange={(e) => setEdit({ ...edit, aiCredits: e.target.value as any })} />
              </>
            ) : (
              <div style={{ ...hint, marginTop: 10 }}>FOMO Intel — access-only продукт, <b>без AI-кредитов</b>.</div>
            )}

            {edit.productType === 'FOMO_INTEL' ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.accent, marginTop: 18 }}>Внешний продукт</div>
                <label style={{ ...label, marginTop: 8 }}>URL (Open FOMO Intel)</label>
                <input style={input} value={edit.externalProductConfig?.url || ''} onChange={(e) => setEdit({ ...edit, externalProductConfig: { ...(edit.externalProductConfig || {}), url: e.target.value } })} />
              </>
            ) : null}

            <div style={{ fontSize: 13, fontWeight: 800, color: T.accent, marginTop: 18 }}>Оффер (маркетинг)</div>
            {(edit.offerItems || []).map((o, i) => (
              <div key={i} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 10, marginTop: 8 }}>
                <input style={input} value={o.title} placeholder="Заголовок" onChange={(e) => patchOffer(i, { title: e.target.value })} />
                <input style={{ ...input, marginTop: 6 }} value={o.description || ''} placeholder="Описание" onChange={(e) => patchOffer(i, { description: e.target.value })} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
                  <input style={input} value={o.icon || ''} placeholder="Icon key (напр. sparkles)" onChange={(e) => patchOffer(i, { icon: e.target.value })} />
                  <input style={input} type="number" value={o.sortOrder ?? i + 1} placeholder="Порядок" onChange={(e) => patchOffer(i, { sortOrder: Number(e.target.value) })} />
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6 }}>
                  <label style={{ fontSize: 12, color: T.sub, display: 'flex', gap: 5, alignItems: 'center' }}><input type="checkbox" checked={o.active !== false} onChange={(e) => patchOffer(i, { active: e.target.checked })} /> активен</label>
                  <label style={{ fontSize: 12, color: T.sub, display: 'flex', gap: 5, alignItems: 'center' }}><input type="checkbox" checked={!!(o as any).highlighted} onChange={(e) => patchOffer(i, { highlighted: e.target.checked } as any)} /> выделить</label>
                  <button style={{ ...btn('danger'), padding: '4px 10px', fontSize: 12 }} onClick={() => setEdit({ ...edit, offerItems: (edit.offerItems || []).filter((_, j) => j !== i) })}>Удалить</button>
                </div>
              </div>
            ))}
            <button style={{ ...btn('ghost'), marginTop: 8 }} data-testid="offer-add" onClick={() => setEdit({ ...edit, offerItems: [...(edit.offerItems || []), { title: 'Новый пункт', active: true, sortOrder: (edit.offerItems || []).length + 1 }] })}>+ Добавить пункт оффера</button>

            <div style={{ fontSize: 13, fontWeight: 800, color: T.accent, marginTop: 18 }}>Доступ (capabilities)</div>
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {(edit.capabilities || []).map((c) => (
                <span key={c.capabilityKey} style={{ ...badge('#F1F5F9', '#475569'), display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                  {capName(c.capabilityKey)}
                  <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#DC2626', fontWeight: 800 }} onClick={() => setEdit({ ...edit, capabilities: (edit.capabilities || []).filter((x) => x.capabilityKey !== c.capabilityKey) })}>×</button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <AdminSelect value={newCap} onChange={setNewCap} options={caps.filter((c) => !(edit.capabilities || []).some((x) => x.capabilityKey === c.key)).map((c) => ({ value: c.key, label: c.name }))} testid="cap-add-select" />
              <button style={btn('ghost')} disabled={!newCap} onClick={() => { setEdit({ ...edit, capabilities: [...(edit.capabilities || []), { capabilityKey: newCap }] }); setNewCap(''); }}>Добавить</button>
            </div>

            <div style={{ fontSize: 13, fontWeight: 800, color: T.accent, marginTop: 18 }}>Жизненный цикл</div>
            <label style={{ ...label, marginTop: 8 }}>Статус</label>
            <AdminSelect value={edit.status} onChange={(v: string) => setEdit({ ...edit, status: v })} options={[{ value: 'DRAFT', label: 'Черновик' }, { value: 'ACTIVE', label: 'Активен' }, { value: 'ARCHIVED', label: 'Архив' }]} testid="plan-status" />
            <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 13, color: T.ink, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={edit.purchasable !== false} onChange={(e) => setEdit({ ...edit, purchasable: e.target.checked })} /> Purchasable</label>
              <label style={{ fontSize: 13, color: T.ink, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={edit.visible !== false} onChange={(e) => setEdit({ ...edit, visible: e.target.checked })} /> Visible</label>
              <label style={{ fontSize: 13, color: T.ink, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={!!edit.recommended} onChange={(e) => setEdit({ ...edit, recommended: e.target.checked })} /> Recommended</label>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button style={btn('primary')} data-testid="product-save" disabled={saving} onClick={save}>{saving ? 'Сохранение…' : 'Сохранить'}</button>
              <button style={btn('ghost')} onClick={() => setEdit(null)}>Отмена</button>
              <button style={{ ...btn('danger'), marginLeft: 'auto' }} data-testid="product-delete-editor" onClick={() => remove(edit)}>Удалить тариф</button>
            </div>
            <div style={{ ...hint, marginTop: 10 }}>Сохранение увеличивает версию. Проданные периоды используют свой snapshot и не меняются.</div>
          </div>
        </div>
      ) : null}
      {preview ? (
        <div style={drawerWrap} onClick={() => setPreview(null)}>
          <div style={{ ...drawerBody, width: 400 }} onClick={(e) => e.stopPropagation()} data-testid="product-preview-modal">
            <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: 1 }}>Как видит пользователь</div>
            <div style={{ marginTop: 14, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22, background: 'linear-gradient(180deg,#0B1020,#131a33)' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{preview.name}</div>
              <div style={{ fontSize: 13, color: '#9fb0d0', marginTop: 3 }}>{preview.subtitle || ''}</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', margin: '14px 0 2px' }}>${preview.priceUsd}<span style={{ fontSize: 14, color: '#9fb0d0', fontWeight: 600 }}> /{preview.durationDays} дней</span></div>
              {preview.description ? <div style={{ fontSize: 13, color: '#c7d2e8', marginTop: 10, lineHeight: '20px' }}>{preview.description}</div> : null}
              <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
                {(preview.offerItems || []).filter((o) => o.active !== false).map((o, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10 }}><span style={{ color: '#34d399', fontWeight: 800 }}>✓</span><div><div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff' }}>{o.title}</div>{o.description ? <div style={{ fontSize: 12, color: '#9fb0d0' }}>{o.description}</div> : null}</div></div>
                ))}
                {preview.productType !== 'FOMO_INTEL' ? <div style={{ display: 'flex', gap: 10 }}><span style={{ color: '#34d399', fontWeight: 800 }}>✓</span><div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff' }}>{preview.aiCredits ?? preview.aiCreditsIncluded} AI-кредитов</div></div> : null}
              </div>
              <button style={{ width: '100%', marginTop: 20, padding: '12px', borderRadius: 12, border: 'none', background: T.accent, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                {preview.productType === 'FOMO_INTEL' ? 'Open FOMO Intel' : `Get ${preview.name}`}
              </button>
            </div>
            <button style={{ ...btn('ghost'), marginTop: 18 }} onClick={() => setPreview(null)}>Закрыть</button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
export const CapabilitiesTab: React.FC = () => {
  const [caps, setCaps] = useState<api.Capability[]>([]);
  const [plans, setPlans] = useState<api.Plan[]>([]);
  const [detail, setDetail] = useState<api.Capability | null>(null);
  useEffect(() => { api.getCapabilities().then((r) => setCaps(r.items)); api.getPlans().then((r) => setPlans(r.items)); }, []);
  const plansFor = (key: string) => plans.filter((p) => (p.capabilities || []).some((c) => c.capabilityKey === key)).map((p) => p.name);
  const backend = (k: string) => CAP_BACKEND[k] || { label: '—', connected: false };
  return (
    <div style={card}>
      <div style={{ ...hint, marginTop: 0, marginBottom: 12 }}>Реестр возможностей. Тип определяет модель гейтинга. External/Hybrid никогда не эмулируются подпиской — eligibility решает существующий NFT/staking-движок.</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead><tr><th style={th}>Возможность</th><th style={th}>Тип</th><th style={th}>Домен</th><th style={th}>Тарифы</th><th style={th}>Backend</th><th style={th}>Статус</th><th style={th}></th></tr></thead>
          <tbody>
            {caps.map((c) => (
              <tr key={c.key}>
                <td style={td}><div style={{ fontWeight: 700 }}>{capName(c.key)}</div><div style={keySmall}>{c.key}</div></td>
                <td style={td}>{typeBadge(c.accessType)}</td>
                <td style={td}>{c.domain}</td>
                <td style={td}>{plansFor(c.key).length ? plansFor(c.key).map((p) => <span key={p} style={{ ...badge('#F1F5F9', '#475569'), marginRight: 4 }}>{p}</span>) : <span style={{ color: T.sub }}>—</span>}</td>
                <td style={td}>{backend(c.key).connected ? <span style={badge('#D1FAE5', '#059669')}>CONNECTED</span> : <span style={badge('#F1F5F9', '#64748B')}>не подключено</span>}<div style={{ fontSize: 11, color: T.sub, marginTop: 3 }}>{backend(c.key).label}</div></td>
                <td style={td}>{c.active ? <span style={badge('#D1FAE5', '#059669')}>активна</span> : <span style={badge('#FEE2E2', '#DC2626')}>выкл</span>}</td>
                <td style={td}><button style={btn('ghost')} onClick={() => setDetail(c)}>Подробнее</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {detail ? (
        <div style={drawerWrap} onClick={() => setDetail(null)}>
          <div style={drawerBody} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>{capName(detail.key)}</div>
            <div style={keySmall}>{detail.key}</div>
            <div style={{ marginTop: 14 }}>{typeBadge(detail.accessType)}</div>
            <p style={{ fontSize: 13, color: T.ink, marginTop: 12 }}>{detail.description || '—'}</p>
            <div style={{ marginTop: 12 }}><div style={label}>Backend integration</div>{backend(detail.key).connected ? <span style={badge('#D1FAE5', '#059669')}>CONNECTED</span> : <span style={badge('#F1F5F9', '#64748B')}>не подключено</span>} <span style={{ fontSize: 12.5, color: T.sub }}>{backend(detail.key).label}</span></div>
            <div style={{ marginTop: 12 }}><div style={label}>Доступно в тарифах</div>{plansFor(detail.key).length ? plansFor(detail.key).map((p) => <span key={p} style={{ ...badge('#F1F5F9', '#475569'), marginRight: 5 }}>{p}</span>) : <span style={{ color: T.sub }}>—</span>}</div>
            {detail.eligibilityProvider ? <div style={{ marginTop: 12 }}><div style={label}>Eligibility provider</div>{detail.eligibilityProvider}</div> : null}
            <button style={{ ...btn('ghost'), marginTop: 20 }} onClick={() => setDetail(null)}>Закрыть</button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

/* =================== ПОДПИСКИ =================== */
export const SubscriptionsTab: React.FC = () => {
  const [rows, setRows] = useState<api.Subscription[]>([]);
  const [plans, setPlans] = useState<api.Plan[]>([]);
  const [user, setUser] = useState(''); const [planCode, setPlanCode] = useState(''); const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const load = () => api.getSubscriptions().then((r) => setRows(r.items)).catch(() => toast.error('Ошибка загрузки подписок'));
  useEffect(() => { load(); api.getPlans().then((r) => { setPlans(r.items); if (r.items[0]) setPlanCode(r.items[0].code); }); }, []);
  const create = async () => { if (!user.trim()) return toast.error('Укажите пользователя'); setBusy(true); try { await api.createSubscription({ user: user.trim(), planCode, activate: true }); toast.success('Подписка создана и активирована'); setUser(''); load(); } catch (e: any) { toast.error(e.message); } finally { setBusy(false); } };
  const act = async (id: string, a: any, body?: any) => { if ((a === 'revoke' || a === 'expire') && !window.confirm('Подтвердить действие?')) return; try { await api.subAction(id, a, body); toast.success('Готово'); load(); } catch (e: any) { toast.error(e.message); } };
  const openDetail = async (s: any) => { setDetail({ sub: s, loading: true }); try { const d = await api.getDiagnostics(s.userId); const ents = (d.entitlements || []).filter((e: any) => String(e.sourceId) === String(s._id)); setDetail({ sub: s, ents, credits: d.credits, loading: false }); } catch { setDetail({ sub: s, ents: [], loading: false }); } };
  return (
    <div>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>Выдать подписку (ручная / тестовая)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr auto', gap: 12, alignItems: 'end', marginTop: 12 }}>
          <div><label style={label}>Пользователь</label><input style={input} value={user} onChange={(e) => setUser(e.target.value)} placeholder="ID / 0x-кошелёк / email" /></div>
          <div><label style={label}>Тариф</label><AdminSelect value={planCode} onChange={setPlanCode} options={plans.map((p) => ({ value: p.code, label: `${p.name} ($${p.priceUsd})` }))} testid="sub-plan" /></div>
          <button style={btn('primary')} disabled={busy} onClick={create}>{busy ? 'Создаю…' : 'Выдать и активировать'}</button>
        </div>
      </div>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>Подписки ({rows.length})</div>
          <button style={btn('ghost')} onClick={async () => { const r = await api.runExpiry(); toast.success(`Реконсиляция: grace=${r.result.toGrace}, expired=${r.result.expired}`); load(); }}>Проверить истечения</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 940 }}>
            <thead><tr><th style={th}>Пользователь</th><th style={th}>Тариф</th><th style={th}>Статус</th><th style={th}>Период</th><th style={th}>Источник</th><th style={th}>Действия</th></tr></thead>
            <tbody>
              {rows.length === 0 ? <tr><td style={{ ...td, color: T.sub }} colSpan={6}>Подписок пока нет.</td></tr> : rows.map((s: any) => (
                <tr key={s._id}>
                  <td style={td}><button style={{ ...btn('ghost'), padding: '4px 8px' }} onClick={() => openDetail(s)}>{String(s.userId).slice(-8)}</button>{s.originWallet ? <div style={keySmall}>{s.originWallet}</div> : null}</td>
                  <td style={td}>{s.planSnapshot?.name || s.planSnapshot?.code || '—'} <span style={{ color: T.sub }}>v{s.planVersion}</span></td>
                  <td style={td}>{statusBadge(s.status)}</td>
                  <td style={td}>{fmt(s.currentPeriodStart)} → {fmt(s.currentPeriodEnd)}</td>
                  <td style={td}>{subSourceLabel(s.source)}</td>
                  <td style={td}><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><button style={btn('ghost')} onClick={() => act(s._id, 'extend', { days: 30 })}>+30д</button><button style={btn('ghost')} onClick={() => act(s._id, 'cancel')}>Отменить</button><button style={btn('danger')} onClick={() => act(s._id, 'expire')}>Истечь</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {detail ? (
        <div style={drawerWrap} onClick={() => setDetail(null)}>
          <div style={drawerBody} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, marginBottom: 4 }}>Подписка</div>
            <div style={{ marginBottom: 12 }}>{statusBadge(detail.sub.status)} <span style={{ fontSize: 13, marginLeft: 6 }}>{detail.sub.planSnapshot?.name} v{detail.sub.planVersion}</span></div>
            <div style={{ ...hint, marginTop: 0 }}>Период: {fmt(detail.sub.currentPeriodStart)} → {fmt(detail.sub.currentPeriodEnd)} · Источник: {subSourceLabel(detail.sub.source)}</div>
            {detail.sub.originWallet ? <div style={keySmall}>wallet: {detail.sub.originWallet}</div> : null}
            <div style={{ fontSize: 13, fontWeight: 800, color: T.accent, marginTop: 16 }}>Доступ (выданные возможности)</div>
            {detail.loading ? <div style={hint}>Загрузка…</div> : (detail.ents || []).length ? (detail.ents || []).map((e: any) => <div key={e._id} style={{ fontSize: 13, padding: '4px 0', display: 'flex', gap: 8 }}><span style={{ color: '#059669', fontWeight: 800 }}>✓</span>{capName(e.capabilityKey)} <span style={{ color: T.sub }}>· до {fmt(e.validUntil)}</span></div>) : <div style={hint}>Нет активных (подписка истекла/отозвана).</div>}
            {detail.credits ? <><div style={{ fontSize: 13, fontWeight: 800, color: T.accent, marginTop: 16 }}>AI-кредиты</div><div style={hint}>Available {detail.credits.available} · Monthly {detail.credits.monthly} · Top-up {detail.credits.topup} · Reserved {detail.credits.reserved}</div></> : null}
            <button style={{ ...btn('ghost'), marginTop: 20 }} onClick={() => setDetail(null)}>Закрыть</button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

/* =================== ДОСТУПЫ =================== */
export const GrantsTab: React.FC = () => {
  const [caps, setCaps] = useState<api.Capability[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [user, setUser] = useState(''); const [cap, setCap] = useState('earlyland.prime'); const [reason, setReason] = useState(''); const [dur, setDur] = useState('30'); const [busy, setBusy] = useState(false);
  const load = () => api.listGrants().then((r) => setRows(r.items)).catch(() => {});
  useEffect(() => { api.getCapabilities().then((r) => setCaps(r.items.filter((c) => c.accessType !== 'EXTERNAL_ELIGIBILITY'))); load(); }, []);
  const create = async () => {
    if (!user.trim()) return toast.error('Укажите пользователя');
    if (!reason.trim()) return toast.error('Причина обязательна');
    setBusy(true);
    try { const validUntil = dur ? new Date(Date.now() + Number(dur) * 86400000).toISOString() : undefined; const r = await api.createGrant({ user: user.trim(), capabilityKey: cap, reason, validUntil }); if (r.ok === false) toast.error(r.error); else { toast.success('Доступ выдан (только эта возможность)'); setUser(''); setReason(''); load(); } }
    catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  const revoke = async (id: string) => { const why = window.prompt('Причина отзыва:'); if (!why) return; try { await api.revokeGrant(id); toast.success('Отозвано'); load(); } catch (e: any) { toast.error(e.message); } };
  return (
    <div>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>Прямой доступ (одна возможность)</div>
        <div style={{ ...hint, marginTop: 4 }}>В отличие от подписки, выдаёт <b>одну</b> возможность на срок, не открывая весь тариф. Напр.: EarlyLand Prime на 14 дней.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.3fr 1.4fr 1fr auto', gap: 10, alignItems: 'end', marginTop: 14 }}>
          <div><label style={label}>Пользователь *</label><input style={input} value={user} onChange={(e) => setUser(e.target.value)} placeholder="ID / 0x / email" /></div>
          <div><label style={label}>Возможность</label><AdminSelect value={cap} onChange={setCap} options={caps.map((c) => ({ value: c.key, label: capName(c.key) }))} testid="grant-cap" /></div>
          <div><label style={label}>Причина *</label><input style={input} list="reason-presets" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Partner / Beta tester …" /><datalist id="reason-presets">{REASON_PRESETS.map((r) => <option key={r} value={r} />)}</datalist></div>
          <div><label style={label}>Срок</label><AdminSelect value={dur} onChange={setDur} options={DURATION_PRESETS} testid="grant-dur" /></div>
          <button style={btn('primary')} disabled={busy} onClick={create}>{busy ? 'Выдаю…' : 'Выдать'}</button>
        </div>
      </div>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 8 }}>Ручные доступы ({rows.length})</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
            <thead><tr><th style={th}>Пользователь</th><th style={th}>Возможность</th><th style={th}>Источник</th><th style={th}>Выдан</th><th style={th}>Истекает</th><th style={th}>Статус</th><th style={th}></th></tr></thead>
            <tbody>
              {rows.length === 0 ? <tr><td style={{ ...td, color: T.sub }} colSpan={7}>Ручных доступов пока нет.</td></tr> : rows.map((g) => (
                <tr key={g._id}>
                  <td style={td}>{g.email || g.wallet || String(g.userId).slice(-8)}</td>
                  <td style={td}><div style={{ fontWeight: 700 }}>{capName(g.capabilityKey)}</div><div style={keySmall}>{g.capabilityKey}</div></td>
                  <td style={td}>{sourceLabel('admin_grant')}<div style={{ fontSize: 11, color: T.sub }}>{g.reason || ''}</div></td>
                  <td style={td}>{fmt(g.validFrom)}</td>
                  <td style={td}>{fmt(g.validUntil)}</td>
                  <td style={td}>{statusBadge(g.status)}</td>
                  <td style={td}>{g.status === 'ACTIVE' ? <button style={btn('danger')} onClick={() => revoke(g._id)}>Отозвать</button> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* =================== NFT =================== */
export const NftTab: React.FC = () => (
  <div>
    <div style={{ ...card, borderLeft: `4px solid ${T.accent}` }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>NFT Benefit Rules</div>
      <div style={{ ...hint, marginTop: 4 }}>Правила: подтверждённое on-chain событие (существующий mint/market/staking) → коммерческий benefit. Мы НЕ создаём Web3-исполнение — только интерпретацию.</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720, marginTop: 12 }}>
        <thead><tr><th style={th}>Коллекция</th><th style={th}>Событие</th><th style={th}>Выдаёт</th><th style={th}>Срок</th><th style={th}>Transfer</th><th style={th}>Renew</th><th style={th}>Статус</th></tr></thead>
        <tbody><tr><td style={{ ...td, color: T.sub }} colSpan={7}>Правил пока нет. CRUD активируется после подключения источника событий (ниже).</td></tr></tbody>
      </table>
    </div>
    <div style={{ ...card, borderLeft: '4px solid #F59E0B' }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>Web3 Event Source</div>
      <div style={{ marginTop: 10, padding: 14, borderRadius: 10, background: '#FEF3C7', color: '#92400E', fontSize: 13, fontWeight: 600 }}>
        Источник on-chain событий <b>не подключён</b>. Правила можно настроить, но автоматическая выдача entitlement не выполняется. Новый indexer НЕ создаётся — будет использован существующий источник событий (contract-first adapter).
      </div>
      <div style={{ ...hint }}>Идемпотентность: <code>chainId:txHash:eventIndex:benefitRuleId</code>. Правила версионируются (snapshot на активацию).</div>
    </div>
  </div>
);

/* =================== AI-КРЕДИТЫ =================== */
export const CreditsTab: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [user, setUser] = useState(''); const [bal, setBal] = useState<any>(null); const [delta, setDelta] = useState(''); const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { api.getCreditRules().then((r) => setRules(r.items)); }, []);
  const lookup = async () => { if (!user.trim()) return; try { const d = await api.getDiagnostics(user.trim()); if (!d.found) return toast.error('Пользователь не найден'); const b = await api.getCreditBalance(d.user._id); setBal({ ...b, _id: d.user._id, email: d.user.email }); } catch (e: any) { toast.error(e.message); } };
  const adjust = async () => { if (!bal) return; setBusy(true); try { await api.creditAdjust({ user: bal._id, delta: Number(delta), reason }); toast.success('Скорректировано (ledger)'); setDelta(''); setReason(''); const b = await api.getCreditBalance(bal._id); setBal({ ...bal, ...b }); } catch (e: any) { toast.error(e.message); } finally { setBusy(false); } };
  return (
    <div>
      <div style={{ ...card, background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
        <div style={{ fontSize: 13, color: '#3730A3', fontWeight: 600 }}>Кредиты и доступ — <b>две разные проверки</b>. Пользователь может иметь 10 000 кредитов, но без возможности <i>FOMO AI — Deep Research</i> операция всё равно DENY. Порядок: проверка доступа → баланс → reserve → операция → capture/release.</div>
      </div>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 4 }}>Стоимость AI-функций</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
          <thead><tr><th style={th}>AI-функция</th><th style={th}>Цена</th><th style={th}>Требуемый доступ</th><th style={th}>Класс</th><th style={th}>Статус</th></tr></thead>
          <tbody>{rules.map((r) => <tr key={r.operationType}><td style={td}><b>{r.name}</b><div style={keySmall}>{r.operationType}</div></td><td style={td}>{r.baseCredits} cr</td><td style={td}>{r.capabilityRequired ? capName(r.capabilityRequired) : '—'}</td><td style={td}>{r.modelClass}</td><td style={td}>{r.active ? <span style={badge('#D1FAE5', '#059669')}>Active</span> : <span style={badge('#F1F5F9', '#64748B')}>off</span>}</td></tr>)}</tbody>
        </table>
      </div>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 4 }}>Балансы пользователя</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'end' }}>
          <div style={{ flex: 1, maxWidth: 360 }}><label style={label}>Пользователь</label><input style={input} value={user} onChange={(e) => setUser(e.target.value)} placeholder="ID / 0x / email" /></div>
          <button style={btn('primary')} onClick={lookup}>Показать баланс</button>
        </div>
        {bal ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ ...hint, marginTop: 0 }}>{bal.email} · {bal._id}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10, marginTop: 10 }}>
              {[['Monthly', bal.monthly], ['Top-up', bal.topup], ['Reserved', bal.reserved], ['Available', bal.available], ['Total', bal.total]].map((x) => (<div key={x[0] as string} style={{ ...card, marginBottom: 0, padding: 12 }}><div style={{ fontSize: 12, color: T.sub, fontWeight: 700 }}>{x[0]}</div><div style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>{x[1]}</div></div>))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr auto', gap: 10, marginTop: 14, alignItems: 'end' }}>
              <div><label style={label}>Δ credits (+/-)</label><input style={input} type="number" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="100 / -50" /></div>
              <div><label style={label}>Причина *</label><input style={input} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="promo / коррекция / возврат" /></div>
              <button style={btn('primary')} disabled={busy || !delta || !reason} onClick={adjust}>Применить</button>
            </div>
            <div style={hint}>Любая корректировка — ledger-транзакция с причиной. Прямое редактирование баланса невозможно.</div>
          </div>
        ) : null}
      </div>
      <div style={card}><div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 4 }}>Экономика</div><div style={{ ...hint, marginTop: 0 }}>Provider cost / margin считаются автоматически при появлении реальных AI-usage событий. Сейчас: <b>нет данных</b> (mock не включается в статистику).</div></div>
    </div>
  );
};

/* =================== ДИАГНОСТИКА (Explain Access) =================== */
const DecisionRow: React.FC<{ a: api.AccessDecision }> = ({ a }) => {
  const [trace, setTrace] = useState(false);
  const conditional = a.accessType === 'HYBRID' && a.accessAllowed && !a.allowed;
  const decision = a.allowed ? 'ALLOW' : conditional ? 'CONDITIONAL' : 'DENY';
  const col: any = { ALLOW: ['#D1FAE5', '#059669'], DENY: ['#FEE2E2', '#DC2626'], CONDITIONAL: ['#FEF3C7', '#B45309'] }[decision];
  const why = a.allowed ? 'Активный доступ' : conditional ? 'Доступ к функции есть, требуется NFT eligibility' : reasonLabel(a.reason);
  return (
    <>
      <tr>
        <td style={td}><div style={{ fontWeight: 700 }}>{capName(a.capability)}</div><div style={{ marginTop: 3 }}>{typeBadge(a.accessType)}</div></td>
        <td style={td}><span style={badge(col[0], col[1])}>{decision}</span></td>
        <td style={td}>{why}{a.legacySource ? <div style={{ fontSize: 10.5, color: '#B45309', marginTop: 3 }}>legacy adapter</div> : null}</td>
        <td style={td}>{a.allowed ? sourceLabel(a.source) : '—'}</td>
        <td style={td}>{a.validUntil ? new Date(a.validUntil).toLocaleDateString('ru-RU') : '—'}</td>
        <td style={td}><button style={{ ...btn('ghost'), padding: '3px 8px', fontSize: 11 }} onClick={() => setTrace(!trace)}>{trace ? 'Скрыть' : 'Trace'}</button></td>
      </tr>
      {trace ? (
        <tr><td style={{ ...td, background: '#0F172A', color: '#E2E8F0', fontFamily: 'monospace', fontSize: 11.5 }} colSpan={6}>
          capability: {a.capability} · accessType: {a.accessType} · accessResolver: {a.accessAllowed ? 'PASS' : 'FAIL'}{a.eligibilityRequired ? ` · externalEligibility: FAIL (provider ${a.eligibilityProvider})` : ''} · source: {a.source || 'null'} · reason: {a.reason || 'null'} · final: {decision}
        </td></tr>
      ) : null}
    </>
  );
};

export const DiagnosticsTab: React.FC = () => {
  const [q, setQ] = useState(''); const [d, setD] = useState<any>(null); const [busy, setBusy] = useState(false);
  const run = async () => { if (!q.trim()) return; setBusy(true); try { const r = await api.getDiagnostics(q.trim()); if (!r.found) { toast.error('Пользователь не найден'); setD(null); } else setD(r); } catch (e: any) { toast.error(e.message); } finally { setBusy(false); } };
  const activeSub = d ? (d.subscriptions || []).find((s: any) => s.status === 'ACTIVE') : null;
  return (
    <div>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 4 }}>Explain Access — диагностика доступа</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'end' }}>
          <div style={{ flex: 1, maxWidth: 460 }}><label style={label}>userId / wallet / email</label><input style={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="ObjectId, 0x-кошелёк или email" /></div>
          <button style={btn('primary')} disabled={busy} onClick={run}>{busy ? '…' : 'Проверить'}</button>
        </div>
      </div>
      {d ? (
        <>
          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{d.user.email || '—'}</div>
            <div style={{ ...hint, marginTop: 2 }}>{d.user._id} · {d.user.wallet || 'без кошелька'} · роль: {(d.user.role || []).join(', ') || '—'}</div>
            <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div><div style={label}>Коммерческий статус</div>{activeSub ? <div>{statusBadge('ACTIVE')} <b style={{ marginLeft: 6 }}>{activeSub.planSnapshot?.name}</b> <span style={{ color: T.sub }}>до {fmt(activeSub.currentPeriodEnd)}</span></div> : <span style={{ color: T.sub }}>Нет активной подписки (бесплатный слой)</span>}</div>
              {d.credits ? <div><div style={label}>AI-кредиты</div><b>{d.credits.available}</b> <span style={{ color: T.sub }}>available (monthly {d.credits.monthly}, top-up {d.credits.topup}, reserved {d.credits.reserved})</span></div> : null}
            </div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 10 }}>Возможности</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
                <thead><tr><th style={th}>Возможность</th><th style={th}>Решение</th><th style={th}>Почему</th><th style={th}>Источник</th><th style={th}>До</th><th style={th}></th></tr></thead>
                <tbody>{(d.access || []).map((a: api.AccessDecision) => <DecisionRow key={a.capability} a={a} />)}</tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
