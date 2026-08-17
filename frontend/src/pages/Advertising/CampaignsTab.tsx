import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { T, Card, SimpleTable, Badge, StateBlock, KpiCard, KpiGrid, Column, fmtDate } from '../Statistics/ui';
import AdPreview from './AdPreview';
import OptionSelect from './OptionSelect';
import CampaignReport from './CampaignReport';
import { field, label, primaryBtn, ghostBtn, dangerBtn, Overlay, statusMeta, pricingLabel, money, num } from './ui';
import {
  listCampaigns, createCampaign, updateCampaign, setCampaignStatus, deleteCampaign,
  getCampaign, listPlacements, createCreative, updateCreative, deleteCreative,
  getCampaignReport, updateReportConfig, generateReport, sendReport, forecast,
  AdCampaign, AdPlacement, AdCreative,
} from '../../components/services/advertising';
import { configureUrl } from '../../components/services/config';

const STATUSES = ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'];
const emptyCampaign = { name: '', advertiserName: '', objective: 'awareness', status: 'draft', pricingModel: 'cpm', rate: 8, budget: 500, priority: 5, startAt: '', endAt: '', timezone: 'UTC', pacing: 'asap', demo: false, placements: [] as string[], targeting: { device: 'all', audience: 'all', geo: { mode: 'all', countries: [] as string[] } }, frequencyCap: { perUserPerDay: 0, perCampaignPer7d: 0, guestSessionCap: 0 } };
const TZ_OPTS = ['UTC', 'Europe/London', 'Europe/Berlin', 'Europe/Moscow', 'America/New_York', 'America/Los_Angeles', 'Asia/Dubai', 'Asia/Singapore'].map((v) => ({ value: v, label: v }));

/* ── Campaign create/edit modal ── */
const CampaignModal: React.FC<{ initial?: any; placements: AdPlacement[]; onClose: () => void; onSaved: () => void }> = ({ initial, placements, onClose, onSaved }) => {
  const [f, setF] = useState<any>(initial ? {
    ...emptyCampaign, ...initial,
    startAt: initial.startAt ? String(initial.startAt).slice(0, 16) : '',
    endAt: initial.endAt ? String(initial.endAt).slice(0, 16) : '',
    timezone: initial.timezone || 'UTC',
    pacing: initial.pacing || 'asap',
    demo: !!initial.demo,
    targeting: { device: 'all', audience: 'all', ...(initial.targeting || {}), geo: { mode: 'all', countries: [], ...((initial.targeting || {}).geo || {}) } },
    frequencyCap: { perUserPerDay: 0, perCampaignPer7d: 0, guestSessionCap: 0, ...(initial.frequencyCap || {}) },
  } : emptyCampaign);
  const [busy, setBusy] = useState(false);
  const [countriesText, setCountriesText] = useState<string>(((initial?.targeting?.geo?.countries) || []).join(', '));
  const togglePlacement = (code: string) => setF((p: any) => ({ ...p, placements: p.placements.includes(code) ? p.placements.filter((c: string) => c !== code) : [...p.placements, code] }));
  const setGeo = (patch: any) => setF((p: any) => ({ ...p, targeting: { ...p.targeting, geo: { ...p.targeting.geo, ...patch } } }));
  const setFC = (patch: any) => setF((p: any) => ({ ...p, frequencyCap: { ...p.frequencyCap, ...patch } }));

  const save = async () => {
    if (!f.name.trim()) return toast.error('Введите название кампании');
    if (!f.placements.length) return toast.error('Выберите хотя бы один плейсмент');
    const countries = countriesText.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
    setBusy(true);
    const body = {
      ...f, rate: Number(f.rate), budget: Number(f.budget), priority: Number(f.priority),
      startAt: f.startAt || null, endAt: f.endAt || null,
      targeting: { ...f.targeting, geo: { mode: f.targeting.geo.mode, countries } },
      frequencyCap: { perUserPerDay: Number(f.frequencyCap.perUserPerDay) || 0, perCampaignPer7d: Number(f.frequencyCap.perCampaignPer7d) || 0, guestSessionCap: Number(f.frequencyCap.guestSessionCap) || 0 },
    };
    const r = initial ? await updateCampaign(initial._id, body) : await createCampaign(body);
    setBusy(false);
    if (r.success) { toast.success(initial ? 'Кампания обновлена' : 'Кампания создана'); onSaved(); onClose(); }
    else toast.error(r.data?.message || 'Ошибка сохранения');
  };

  const sectionTitle = (t: string) => <div style={{ gridColumn: '1 / -1', fontSize: 12, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 6 }}>{t}</div>;

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: '100%', maxWidth: 640, background: '#fff', borderRadius: 16, border: `1px solid ${T.border}`, padding: 22, marginTop: 30, maxHeight: '88vh', overflowY: 'auto' }} data-testid="campaign-modal">
        <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, marginBottom: 16 }}>{initial ? 'Редактировать кампанию' : 'Новая кампания'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}><label style={label}>Название *</label><input style={field} value={f.name} data-testid="c-name" onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><label style={label}>Рекламодатель / бренд</label><input style={field} value={f.advertiserName} onChange={(e) => setF({ ...f, advertiserName: e.target.value })} /></div>
          <div><OptionSelect label="Цель" value={f.objective} onChange={(v) => setF({ ...f, objective: v })} options={[{ value: 'awareness', label: 'Awareness' }, { value: 'traffic', label: 'Traffic' }, { value: 'conversions', label: 'Conversions' }]} /></div>
          <div><OptionSelect label="Модель оплаты" value={f.pricingModel} onChange={(v) => setF({ ...f, pricingModel: v })} options={[{ value: 'cpm', label: 'CPM' }, { value: 'cpc', label: 'CPC' }, { value: 'fixed', label: 'Fixed / Sponsorship' }]} /></div>
          <div><label style={label}>Ставка ($)</label><input type="number" style={field} value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} /></div>
          <div><label style={label}>Бюджет ($, 0 = без лимита)</label><input type="number" style={field} value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} /></div>

          {sectionTitle('Планировщик')}
          <div><label style={label}>Старт (дата и время)</label><input type="datetime-local" style={field} value={f.startAt} data-testid="c-start" onChange={(e) => setF({ ...f, startAt: e.target.value })} /></div>
          <div><label style={label}>Конец (опц. — пусто = бессрочно)</label><input type="datetime-local" style={field} value={f.endAt} data-testid="c-end" onChange={(e) => setF({ ...f, endAt: e.target.value })} /></div>
          <div><OptionSelect label="Часовой пояс" value={f.timezone} onChange={(v) => setF({ ...f, timezone: v })} options={TZ_OPTS} /></div>
          <div data-testid="c-status"><OptionSelect label="Статус (сверяется с датами)" value={f.status} onChange={(v) => setF({ ...f, status: v })} options={STATUSES.map((s) => ({ value: s, label: statusMeta[s].label }))} /></div>
          <div style={{ gridColumn: '1 / -1', fontSize: 11.5, color: T.faint }}>Статус вычисляется автоматически из дат: будущий старт → «Запланирована», после окончания → «Завершена». Ручные draft / paused / cancelled сохраняются.</div>

          {sectionTitle('Таргетинг')}
          <div><OptionSelect label="Устройства" value={f.targeting.device} onChange={(v) => setF({ ...f, targeting: { ...f.targeting, device: v } })} options={[{ value: 'all', label: 'Все' }, { value: 'desktop', label: 'Desktop' }, { value: 'mobile', label: 'Mobile' }]} /></div>
          <div><OptionSelect label="Аудитория" value={f.targeting.audience} onChange={(v) => setF({ ...f, targeting: { ...f.targeting, audience: v } })} options={[{ value: 'all', label: 'Все' }, { value: 'guest', label: 'Гости' }, { value: 'user', label: 'Авторизованные' }]} /></div>
          <div><OptionSelect label="Гео-режим" value={f.targeting.geo.mode} onChange={(v) => setGeo({ mode: v })} options={[{ value: 'all', label: 'Все страны' }, { value: 'allow', label: 'Только выбранные' }, { value: 'exclude', label: 'Исключить выбранные' }]} /></div>
          <div><label style={label}>Страны (ISO2, через запятую)</label><input style={field} placeholder="DE, FR, US" value={countriesText} data-testid="c-geo-countries" disabled={f.targeting.geo.mode === 'all'} onChange={(e) => setCountriesText(e.target.value)} /></div>

          {sectionTitle('Частота и pacing')}
          <div><OptionSelect label="Pacing" value={f.pacing} onChange={(v) => setF({ ...f, pacing: v })} options={[{ value: 'asap', label: 'As fast as possible' }, { value: 'even', label: 'Even (равномерно)' }]} /></div>
          <div><label style={label}>Показов/юзеру/день (0=∞)</label><input type="number" style={field} value={f.frequencyCap.perUserPerDay} data-testid="c-fc-day" onChange={(e) => setFC({ perUserPerDay: e.target.value })} /></div>
          <div><label style={label}>Показов/кампанию/7 дней (0=∞)</label><input type="number" style={field} value={f.frequencyCap.perCampaignPer7d} onChange={(e) => setFC({ perCampaignPer7d: e.target.value })} /></div>
          <div><label style={label}>Гостевой cap/сессия (0=∞)</label><input type="number" style={field} value={f.frequencyCap.guestSessionCap} onChange={(e) => setFC({ guestSessionCap: e.target.value })} /></div>
          <div><label style={label}>Приоритет (1–10)</label><input type="number" min={1} max={10} style={field} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.sub, fontWeight: 700, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!f.demo} data-testid="c-demo" onChange={(e) => setF({ ...f, demo: e.target.checked })} /> Демо / тест (не в production-аналитике)
          </label>
        </div>
        <div style={{ marginTop: 16 }}>
          <label style={label}>Плейсменты *</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} data-testid="c-placements">
            {placements.map((p) => {
              const on = f.placements.includes(p.code);
              return <button key={p.code} onClick={() => togglePlacement(p.code)} style={{ padding: '7px 12px', borderRadius: 999, border: `1px solid ${on ? T.accent : T.border}`, background: on ? '#EEF2FF' : '#fff', color: on ? T.accent : T.sub, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>{p.adminName}</button>;
            })}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button style={ghostBtn} onClick={onClose} disabled={busy}>Отмена</button>
          <button style={primaryBtn} onClick={save} disabled={busy} data-testid="c-save">{busy ? 'Сохранение…' : 'Сохранить'}</button>
        </div>
      </div>
    </Overlay>
  );
};

/* ── Creative editor (inside drawer) ── */
const emptyCreative = { type: 'image', creativeSource: 'CUSTOM', productCode: '', brandName: '', logoUrl: '', imageUrl: '', headline: '', description: '', ctaLabel: 'Learn more', destinationUrl: '', sponsoredLabel: 'Ad', variant: 'dark', displaySize: 'standard', template: 'facts', kindOverride: '', progress: 0, progressLabel: '', alt: '', enabled: true, highlights: [] as { label: string; value: string; link?: string }[] };

const TEMPLATE_OPTS = [
  { value: 'facts', label: 'Факты (сетка)' },
  { value: 'deal', label: 'Сделка / инвест (строки + прогресс)' },
  { value: 'offer', label: 'Оффер OTC / P2P (строки)' },
  { value: 'profile', label: 'Профиль (фонд / персона / юзер)' },
  { value: 'minimal', label: 'Минимал (заголовок + CTA)' },
];
const TEMPLATE_HINT: Record<string, string> = {
  facts: 'Компактная сетка фактов — напр. APY / TVL / мин. депозит (Spaceport).',
  deal: 'Строки «метка → значение» + полоса прогресса сбора. Для Launchpad / Echo.',
  offer: 'Строки оффера — актив, цена, объём. Для OTC / P2P / Bazar.',
  profile: 'Карточка профиля — фонд, персона или пользователь + статистика.',
  minimal: 'Только заголовок, описание и кнопка.',
};

const CreativeForm: React.FC<{ campaignId: string; initial?: any; onSaved: () => void; onCancel?: () => void }> = ({ campaignId, initial, onSaved, onCancel }) => {
  const isEdit = !!initial?._id;
  const [c, setC] = useState<any>(initial ? { ...emptyCreative, ...initial, highlights: initial.highlights || [] } : emptyCreative);
  const [busy, setBusy] = useState(false);
  const [factSource, setFactSource] = useState<string>((initial?.highlights?.[0]?.source) || 'manual');
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    fetch(configureUrl('products')).then((r) => r.json()).then((d) => setProducts(d?.items || [])).catch(() => setProducts([]));
  }, []);
  const isProduct = c.creativeSource === 'PRODUCT';
  const selProduct = products.find((p) => p.code === c.productCode);
  const save = async () => {
    if (isProduct && !c.productCode) return toast.error('Выберите продукт из Product CMS');
    if (!isProduct && !c.headline.trim()) return toast.error('Введите headline');
    setBusy(true);
    const highlights = (c.highlights || []).filter((h: any) => h.label || h.value).map((h: any) => ({ ...h, source: factSource }));
    const body = { ...c, progress: Number(c.progress) || 0, highlights };
    const r = isEdit ? await updateCreative(initial._id, body) : await createCreative(campaignId, body);
    setBusy(false);
    if (r.success) { toast.success(isEdit ? 'Креатив обновлён' : 'Креатив добавлен'); if (!isEdit) { setC(emptyCreative); setFactSource('manual'); } onSaved(); if (onCancel) onCancel(); }
    else toast.error('Ошибка');
  };
  const showProgress = c.template === 'deal' || c.template === 'offer';
  const setHL = (i: number, key: string, val: string) => { const hs = [...(c.highlights || [])]; hs[i] = { ...hs[i], [key]: val }; setC({ ...c, highlights: hs }); };
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* G26 — first-party product promotion source */}
      <div style={{ border: `1px solid ${isProduct ? T.accent : T.border}`, background: isProduct ? '#F5F3FF' : '#F8FAFC', borderRadius: 12, padding: 12 }} data-testid="cr-source-block">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <OptionSelect label="Источник контента" value={c.creativeSource} onChange={(v) => setC({ ...c, creativeSource: v })} options={[{ value: 'CUSTOM', label: 'CUSTOM — свой креатив' }, { value: 'PRODUCT', label: 'PRODUCT — продукт FOMO (из Product CMS)' }]} />
          {isProduct ? (
            <OptionSelect label="Продукт" value={c.productCode} onChange={(v) => setC({ ...c, productCode: v })} options={[{ value: '', label: '— выбрать —' }, ...products.map((p) => ({ value: p.code, label: `${p.name} · $${p.priceUsd}` }))]} />
          ) : <div />}
        </div>
        {isProduct ? (
          <div style={{ fontSize: 11.5, color: T.sub, marginTop: 8 }} data-testid="cr-product-note">
            Название, цена, CTA и преимущества берутся <b>вживую</b> из Product CMS. Поменяли цену $49→$59 один раз — сайт, витрина и внутренняя реклама не разойдутся.
            {selProduct ? <> Сейчас: <b>{selProduct.name}</b> — ${selProduct.priceUsd}/{selProduct.durationDays}д{selProduct.aiCredits ? `, ${selProduct.aiCredits} кредитов` : ''}.</> : null}
          </div>
        ) : null}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, opacity: isProduct ? 0.55 : 1, pointerEvents: isProduct ? 'none' : 'auto' }}>
        <div><label style={label}>Бренд / проект</label><input style={field} value={c.brandName} onChange={(e) => setC({ ...c, brandName: e.target.value })} /></div>
        <div><OptionSelect label="Стиль" value={c.variant} onChange={(v) => setC({ ...c, variant: v })} options={[{ value: 'dark', label: 'Dark' }, { value: 'gradient', label: 'Gradient' }, { value: 'light', label: 'Light' }]} /></div>
        <div style={{ gridColumn: '1 / -1' }}>
          <OptionSelect label="Шаблон отображения (как показываем)" value={c.template} onChange={(v) => setC({ ...c, template: v })} options={TEMPLATE_OPTS} />
          <div style={{ fontSize: 11.5, color: T.faint, marginTop: 5 }}>{TEMPLATE_HINT[c.template] || ''}</div>
        </div>
        <div><OptionSelect label="Размер показа на сайте" value={c.displaySize} onChange={(v) => setC({ ...c, displaySize: v })} options={[{ value: 'standard', label: 'Стандартный (крупный)' }, { value: 'compact', label: 'Компактный (меньше)' }]} /></div>
        <div><label style={label}>Категория / направление (чип)</label><input style={field} placeholder="напр. Стейкинг · ранние запуски" value={c.kindOverride} data-testid="cr-kind" onChange={(e) => setC({ ...c, kindOverride: e.target.value })} /></div>
        <div style={{ gridColumn: '1 / -1' }}><label style={label}>Headline *</label><input style={field} value={c.headline} data-testid="cr-headline" onChange={(e) => setC({ ...c, headline: e.target.value })} /></div>
        <div style={{ gridColumn: '1 / -1' }}><label style={label}>Описание</label><input style={field} value={c.description} onChange={(e) => setC({ ...c, description: e.target.value })} /></div>
        <div><label style={label}>Logo URL</label><input style={field} value={c.logoUrl} onChange={(e) => setC({ ...c, logoUrl: e.target.value })} /></div>
        <div><label style={label}>Image URL</label><input style={field} value={c.imageUrl} onChange={(e) => setC({ ...c, imageUrl: e.target.value })} /></div>
        <div><label style={label}>Текст кнопки (CTA)</label><input style={field} value={c.ctaLabel} onChange={(e) => setC({ ...c, ctaLabel: e.target.value })} /></div>
        <div><label style={label}>Ссылка кнопки (destination)</label><input style={field} placeholder="https://…" value={c.destinationUrl} data-testid="cr-dest" onChange={(e) => setC({ ...c, destinationUrl: e.target.value })} /></div>
        {showProgress ? (
          <>
            <div><label style={label}>Подпись прогресса</label><input style={field} placeholder="напр. Сбор средств" value={c.progressLabel} onChange={(e) => setC({ ...c, progressLabel: e.target.value })} /></div>
            <div><label style={label}>Прогресс, % (0–100)</label><input type="number" min={0} max={100} style={field} value={c.progress} data-testid="cr-progress" onChange={(e) => setC({ ...c, progress: e.target.value })} /></div>
          </>
        ) : null}
      </div>
      <div style={{ marginTop: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, marginBottom: 6 }}>
          <div style={{ fontSize: 12, color: T.sub, fontWeight: 700 }}>Факты / поля баннера (метка · значение · ссылка) — до 4, блок необязателен</div>
          <div style={{ minWidth: 190 }}>
            <OptionSelect label="Происхождение данных" value={factSource} onChange={setFactSource} options={[{ value: 'manual', label: 'От рекламодателя' }, { value: 'platform', label: 'Данные платформы' }, { value: 'demo', label: 'Демо / тест' }]} />
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {(c.highlights || []).map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...field, flex: '0 0 26%' }} placeholder="Метка (APY)" value={h.label} data-testid={`cr-hl-label-${i}`} onChange={(e) => setHL(i, 'label', e.target.value)} />
              <input style={{ ...field, flex: '0 0 26%' }} placeholder="Значение (12%)" value={h.value} data-testid={`cr-hl-value-${i}`} onChange={(e) => setHL(i, 'value', e.target.value)} />
              <input style={{ ...field, flex: 1 }} placeholder="Ссылка (необяз.)" value={h.link || ''} data-testid={`cr-hl-link-${i}`} onChange={(e) => setHL(i, 'link', e.target.value)} />
              <button onClick={() => setC({ ...c, highlights: (c.highlights || []).filter((_, k) => k !== i) })}
                style={{ border: `1px solid ${T.border}`, background: '#fff', color: T.sub, borderRadius: 8, padding: '0 12px', cursor: 'pointer', fontSize: 16 }} aria-label="Удалить">×</button>
            </div>
          ))}
          {(c.highlights || []).length < 4 ? (
            <button onClick={() => setC({ ...c, highlights: [...(c.highlights || []), { label: '', value: '', link: '' }] })} data-testid="cr-hl-add"
              style={{ border: `1px dashed ${T.border}`, background: 'transparent', color: T.accent, borderRadius: 8, padding: '8px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ Добавить поле</button>
          ) : null}
        </div>
        {factSource === 'demo' ? <div style={{ fontSize: 11, color: T.warn || '#B7791F', marginTop: 6 }}>Демо-данные не должны выдаваться за реальные показатели рекламодателя.</div> : null}
      </div>
      <div><div style={{ fontSize: 12, color: T.sub, marginBottom: 6, fontWeight: 700 }}>Предпросмотр ({c.displaySize === 'compact' ? 'compact' : 'expanded'})</div><AdPreview creative={c} format={c.displaySize === 'compact' ? 'compact' : 'expanded'} /></div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={primaryBtn} onClick={save} disabled={busy} data-testid="cr-save">{busy ? '…' : isEdit ? 'Сохранить изменения' : '+ Добавить креатив'}</button>
        {isEdit && onCancel ? <button style={ghostBtn} onClick={onCancel} disabled={busy}>Отмена</button> : null}
      </div>
    </div>
  );
};

/* ── Causal chain: Budget → Period → Placements → Audience → Inventory → Forecast → Actual ── */
const ChainCard: React.FC<{ data: any; placements: AdPlacement[] }> = ({ data, placements }) => {
  const [fc, setFc] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const code = (data.placements || [])[0];
      if (!code) return;
      const days = data.startAt && data.endAt ? Math.max(1, Math.round((+new Date(data.endAt) - +new Date(data.startAt)) / 864e5)) : 14;
      const r = await forecast({ placement: code, pricingModel: data.pricingModel, rate: data.rate, budget: data.budget, days });
      if (r.success) setFc(r.data);
    })();
  }, [data]);
  const geo = data.targeting?.geo || {};
  const geoTxt = !geo.mode || geo.mode === 'all' ? 'Все страны' : `${geo.mode === 'allow' ? 'Только' : 'Кроме'}: ${(geo.countries || []).join(', ') || '—'}`;
  const invLabel = fc ? (fc.inventoryIsBaseline ? 'Оценка' : 'Факт') : '—';
  const Row = ({ step, val, tag }: { step: string; val: string; tag?: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${T.soft}` }}>
      <div style={{ width: 132, fontSize: 12, color: T.sub, fontWeight: 700 }}>{step}</div>
      <div style={{ flex: 1, fontSize: 13, color: T.ink, fontWeight: 700 }}>{val}</div>
      {tag ? <Badge tone={tag === 'Факт' ? 'good' : tag === 'Прогноз' ? 'info' : 'warn'}>{tag}</Badge> : null}
    </div>
  );
  return (
    <Card>
      <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 8 }}>Как это работает</div>
      <Row step="Бюджет" val={data.budget > 0 ? money(data.budget) : 'Без лимита'} />
      <Row step="Период" val={`${data.startAt ? fmtDate(data.startAt) : '—'} → ${data.endAt ? fmtDate(data.endAt) : 'бессрочно'} · ${data.timezone || 'UTC'} · ${data.pacing === 'even' ? 'even' : 'asap'}`} />
      <Row step="Плейсменты" val={String((data.placements || []).length) + ' шт.'} />
      <Row step="Аудитория" val={`${data.targeting?.device || 'all'} / ${data.targeting?.audience || 'all'} · ${geoTxt}`} />
      <Row step="Инвентарь" val={fc ? `${num(fc.inventoryOverPeriod || fc.expectedImpressions || 0)} показов/период` : '—'} tag={fc ? invLabel : undefined} />
      <Row step="Прогноз" val={fc ? `${num(fc.expectedImpressions || 0)} показов · ${num(fc.expectedClicks || 0)} кликов` : '—'} tag={fc ? 'Прогноз' : undefined} />
      <Row step="Факт" val={`${num(data.stats.viewable)} показов · ${num(data.stats.clicks)} кликов · CTR ${data.stats.ctr}%`} tag="Факт" />
    </Card>
  );
};

/* ── Advertiser report delivery panel ── */
const ReportPanel: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const [st, setSt] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [cadence, setCadence] = useState('off');
  const [recips, setRecips] = useState<string[]>([]);
  const load = useCallback(async () => {
    const r = await getCampaignReport(campaignId);
    if (r.success) { setSt(r.data); setCadence(r.data.report?.cadence || 'off'); setRecips(r.data.report?.recipients || []); }
  }, [campaignId]);
  useEffect(() => { load(); }, [load]);
  if (!st) return <Card><StateBlock kind="loading" /></Card>;
  const connected = st.emailProvider?.status === 'configured';
  const saveCfg = async () => { setBusy(true); const r = await updateReportConfig(campaignId, { cadence, recipients: recips.filter(Boolean) }); setBusy(false); if (r.success) { toast.success('Настройки отчёта сохранены'); load(); } else toast.error('Ошибка'); };
  const gen = async () => { setBusy(true); const r = await generateReport(campaignId); setBusy(false); if (r.success) { toast.success('Отчёт сформирован'); load(); } else toast.error('Ошибка'); };
  const send = async () => { setBusy(true); const r = await sendReport(campaignId); setBusy(false); const s = r.data?.report?.status; if (s === 'sent') toast.success('Отчёт отправлен'); else if (s === 'not_connected') toast.info('Resend не подключён — отправка недоступна'); else toast.error('Не удалось отправить'); load(); };
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>Автоотчёт заказчику</div>
          <Badge tone={connected ? 'good' : 'warn'} data-testid="email-provider-status">{connected ? 'Resend подключён' : 'Resend: не подключено'}</Badge>
        </div>
        {!connected ? <div style={{ fontSize: 12, color: T.sub, marginTop: 6 }}>PDF можно скачать вручную во вкладке «Отчёт и статистика». Автоматическая отправка станет доступна после подключения Resend в Настройки → Email.</div> : null}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
          <div><OptionSelect label="Расписание" value={cadence} onChange={setCadence} options={[{ value: 'off', label: 'Выключено' }, { value: 'weekly', label: 'Еженедельно' }, { value: 'monthly', label: 'Ежемесячно' }, { value: 'on_completion', label: 'По завершению кампании' }]} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: 11.5, color: T.faint }}>Email рекламодателя: {st.advertiserEmail || '— (задайте в карточке рекламодателя)'}</div>
            <div style={{ fontSize: 11.5, color: T.faint, marginTop: 4 }}>Последний: {st.report?.lastReportAt ? fmtDate(st.report.lastReportAt) : '—'} · Следующий: {st.report?.nextReportAt ? fmtDate(st.report.nextReportAt) : '—'}</div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={label}>Доп. получатели</label>
          <div style={{ display: 'grid', gap: 8 }}>
            {recips.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...field, flex: 1 }} placeholder="email@company.com" value={r} data-testid={`report-recip-${i}`} onChange={(e) => { const a = [...recips]; a[i] = e.target.value; setRecips(a); }} />
                <button onClick={() => setRecips(recips.filter((_, k) => k !== i))} style={{ border: `1px solid ${T.border}`, background: '#fff', color: T.sub, borderRadius: 8, padding: '0 12px', cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            ))}
            <button onClick={() => setRecips([...recips, ''])} data-testid="report-recip-add" style={{ border: `1px dashed ${T.border}`, background: 'transparent', color: T.accent, borderRadius: 8, padding: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ Добавить email</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <button style={primaryBtn} onClick={saveCfg} disabled={busy} data-testid="report-save">Сохранить расписание</button>
          <button style={ghostBtn} onClick={gen} disabled={busy} data-testid="report-generate">Сформировать сейчас</button>
          <button style={ghostBtn} onClick={send} disabled={busy} data-testid="report-send">Отправить на email</button>
        </div>
      </Card>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 10 }}>История отчётов</div>
        {(st.history || []).length ? (
          <div style={{ display: 'grid', gap: 8 }}>
            {st.history.map((h: any) => (
              <div key={h._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '9px 11px', border: `1px solid ${T.border}`, borderRadius: 10 }} data-testid="report-history-row">
                <div style={{ fontSize: 12.5, color: T.ink }}>{fmtDate(h.generatedAt)} · {h.trigger} · {(h.recipients || []).length} получ.</div>
                <Badge tone={h.status === 'sent' ? 'good' : h.status === 'not_connected' ? 'warn' : h.status === 'failed' ? 'bad' : 'info'}>{h.status === 'not_connected' ? 'Не подключено' : h.status === 'sent' ? 'Отправлен' : h.status === 'failed' ? 'Ошибка' : 'Сформирован'}</Badge>
              </div>
            ))}
          </div>
        ) : <StateBlock kind="empty" message="Отчёты ещё не формировались" height={50} />}
      </Card>
    </div>
  );
};

/* ── Campaign drawer ── */
const CampaignDrawer: React.FC<{ id: string; placements: AdPlacement[]; onClose: () => void; onChanged: () => void }> = ({ id, placements, onClose, onChanged }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'report' | 'delivery'>('overview');
  const [editId, setEditId] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); const r = await getCampaign(id); setData(r.success ? r.data : null); setLoading(false); }, [id]);
  useEffect(() => { load(); }, [load]);

  const changeStatus = async (s: string) => { const r = await setCampaignStatus(id, s); if (r.success) { toast.success('Статус: ' + statusMeta[s].label); load(); onChanged(); } else toast.error('Ошибка'); };
  const remove = async () => { if (!window.confirm('Удалить кампанию и её креативы?')) return; const r = await deleteCampaign(id); if (r.success) { toast.success('Удалено'); onChanged(); onClose(); } };
  const toggleCreative = async (cr: AdCreative) => { await updateCreative(cr._id, { enabled: !cr.enabled }); load(); };
  const delCreative = async (cr: AdCreative) => { await deleteCreative(cr._id); load(); };

  const placeName = (code: string) => placements.find((p) => p.code === code)?.adminName || code;

  return (
    <Overlay onClose={onClose} align="right">
      <div style={{ width: '100%', maxWidth: 640, background: T.pageBg, height: '100%', overflowY: 'auto', borderLeft: `1px solid ${T.border}`, padding: 24 }} data-testid="campaign-drawer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>Кампания</div>
          <button style={{ ...ghostBtn, padding: '6px 12px' }} onClick={onClose}>Закрыть</button>
        </div>
        {loading || !data ? <Card><StateBlock kind={loading ? 'loading' : 'error'} /></Card> : (
          <div style={{ display: 'grid', gap: 16 }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: T.ink }}>{data.name}</div>
                  <div style={{ fontSize: 13, color: T.sub }}>{data.advertiserName || '—'} · {pricingLabel[data.pricingModel]} · {money(data.rate)}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {data.demo ? <Badge tone="warn">DEMO</Badge> : null}
                  <Badge tone={statusMeta[data.status]?.tone || 'default'}>{statusMeta[data.status]?.label || data.status}</Badge>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => changeStatus(s)} disabled={s === data.status}
                    style={{ padding: '6px 10px', fontSize: 12, borderRadius: 8, border: `1px solid ${T.border}`, cursor: s === data.status ? 'default' : 'pointer', background: s === data.status ? T.accent : '#fff', color: s === data.status ? '#fff' : T.sub, fontWeight: 700 }}>
                    {statusMeta[s].label}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 12.5, color: T.sub }}>Плейсменты: {data.placements.map(placeName).join(', ') || '—'}</div>
              <div style={{ fontSize: 12.5, color: T.sub, marginTop: 4 }}>Период: {data.startAt ? fmtDate(data.startAt) : '—'} → {data.endAt ? fmtDate(data.endAt) : '—'} · таргет: {data.targeting?.device || 'all'}/{data.targeting?.audience || 'all'}</div>
              <div style={{ marginTop: 14 }}><button style={dangerBtn} onClick={remove} data-testid="c-delete">Удалить кампанию</button></div>
            </Card>

            <div style={{ display: 'flex', gap: 6 }} role="tablist">
              <button data-testid="drawer-tab-overview" onClick={() => setDrawerTab('overview')}
                style={{ padding: '9px 16px', borderRadius: 9, border: `1px solid ${drawerTab === 'overview' ? T.accent : T.border}`, background: drawerTab === 'overview' ? '#EEF2FF' : '#fff', color: drawerTab === 'overview' ? T.accent : T.sub, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Обзор и креативы</button>
              <button data-testid="drawer-tab-report" onClick={() => setDrawerTab('report')}
                style={{ padding: '9px 16px', borderRadius: 9, border: `1px solid ${drawerTab === 'report' ? T.accent : T.border}`, background: drawerTab === 'report' ? '#EEF2FF' : '#fff', color: drawerTab === 'report' ? T.accent : T.sub, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Отчёт и статистика</button>
              <button data-testid="drawer-tab-delivery" onClick={() => setDrawerTab('delivery')}
                style={{ padding: '9px 16px', borderRadius: 9, border: `1px solid ${drawerTab === 'delivery' ? T.accent : T.border}`, background: drawerTab === 'delivery' ? '#EEF2FF' : '#fff', color: drawerTab === 'delivery' ? T.accent : T.sub, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Отчёт заказчику</button>
            </div>

            {drawerTab === 'delivery' ? <ReportPanel campaignId={id} /> : drawerTab === 'report' ? <CampaignReport campaignId={id} /> : (
            <>
            <ChainCard data={data} placements={placements} />
            <KpiGrid min={140}>
              <KpiCard label="Показы (viewable)" value={num(data.stats.viewable)} />
              <KpiCard label="Клики" value={num(data.stats.clicks)} tone="good" />
              <KpiCard label="CTR" value={`${data.stats.ctr}%`} />
              <KpiCard label="Расход / Бюджет" value={`${money(data.stats.spend)} / ${money(data.budget)}`} />
            </KpiGrid>

            <Card>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 12 }}>Креативы кампании</div>
              {data.creatives?.length ? (
                <div style={{ display: 'grid', gap: 14, marginBottom: 16 }}>
                  {data.creatives.map((cr: AdCreative) => (
                    <div key={cr._id} style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 12 }} data-testid="creative-row">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
                        <Badge tone={cr.enabled ? 'good' : 'default'}>{cr.enabled ? 'Активен' : 'Выключен'}</Badge>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={{ ...ghostBtn, padding: '5px 10px', fontSize: 12, color: T.accent }} onClick={() => setEditId(editId === cr._id ? null : cr._id)} data-testid="creative-edit">{editId === cr._id ? 'Свернуть' : 'Редактировать'}</button>
                          <button style={{ ...ghostBtn, padding: '5px 10px', fontSize: 12 }} onClick={() => toggleCreative(cr)}>{cr.enabled ? 'Выключить' : 'Включить'}</button>
                          <button style={{ ...ghostBtn, padding: '5px 10px', fontSize: 12, color: T.bad }} onClick={() => delCreative(cr)}>Удалить</button>
                        </div>
                      </div>
                      {editId === cr._id ? (
                        <CreativeForm campaignId={id} initial={cr} onSaved={() => { load(); onChanged(); }} onCancel={() => setEditId(null)} />
                      ) : (
                        <>
                          <AdPreview creative={cr} format={cr.displaySize === 'compact' ? 'compact' : 'expanded'} />
                          <div style={{ marginTop: 8, fontSize: 11.5, color: T.faint }}>Размер: {cr.displaySize === 'compact' ? 'Компактный' : 'Стандартный'} · Шаблон: {cr.template || 'facts'}</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : <StateBlock kind="empty" message="Нет креативов. Добавьте первый ниже." height={60} />}
              <div style={{ borderTop: `1px solid ${T.soft}`, paddingTop: 14 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, marginBottom: 10 }}>Новый креатив</div>
                <CreativeForm campaignId={id} onSaved={() => { load(); onChanged(); }} />
              </div>
            </Card>
            </>
            )}
          </div>
        )}
      </div>
    </Overlay>
  );
};

/* ── Main ── */
const CampaignsTab: React.FC = () => {
  const [rows, setRows] = useState<AdCampaign[]>([]);
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    const [c, p] = await Promise.all([listCampaigns(), listPlacements()]);
    if (c.success) setRows(c.data); else setError(true);
    if (p.success) setPlacements(p.data);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (search && !`${r.name} ${r.advertiserName}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [rows, search, statusFilter]);

  const columns: Column<AdCampaign>[] = [
    { key: 'name', header: 'Кампания', render: (r) => (<div><div style={{ fontWeight: 700, color: T.ink }}>{r.name}</div><div style={{ fontSize: 11, color: T.faint }}>{r.advertiserName || '—'} · {r.placements.length} плейсм. · {r.creativeCount || 0} креатив.</div></div>) },
    { key: 'status', header: 'Статус', render: (r) => <Badge tone={statusMeta[r.status]?.tone || 'default'}>{statusMeta[r.status]?.label || r.status}</Badge> },
    { key: 'pricing', header: 'Модель', render: (r) => <span style={{ color: T.sub }}>{pricingLabel[r.pricingModel]} {money(r.rate)}</span> },
    { key: 'viewable', header: 'Показы', align: 'right', render: (r) => num(r.stats.viewable) },
    { key: 'clicks', header: 'Клики', align: 'right', render: (r) => num(r.stats.clicks) },
    { key: 'ctr', header: 'CTR', align: 'right', render: (r) => `${r.stats.ctr}%` },
    { key: 'spend', header: 'Расход/Бюджет', align: 'right', render: (r) => <span>{money(r.stats.spend)}<span style={{ color: T.faint }}> / {money(r.budget)}</span></span> },
  ];

  const seg = (active: boolean): React.CSSProperties => ({ padding: '8px 12px', borderRadius: 9, border: `1px solid ${active ? T.accent : T.border}`, background: active ? '#EEF2FF' : '#fff', color: active ? T.accent : T.sub, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' });

  return (
    <div style={{ display: 'grid', gap: 16 }} data-testid="ads-campaigns">
      <Card style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input style={{ ...field, width: 260 }} placeholder="Поиск кампаний…" value={search} data-testid="camp-search" onChange={(e) => setSearch(e.target.value)} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button style={seg(statusFilter === '')} onClick={() => setStatusFilter('')}>Все</button>
              {STATUSES.map((s) => <button key={s} style={seg(statusFilter === s)} onClick={() => setStatusFilter(s)}>{statusMeta[s].label}</button>)}
            </div>
          </div>
          <button style={primaryBtn} onClick={() => setShowCreate(true)} data-testid="new-campaign-btn">+ Новая кампания</button>
        </div>
      </Card>
      <Card style={{ padding: 8 }}>
        {loading ? <div style={{ padding: 16 }}><StateBlock kind="loading" /></div>
          : error ? <StateBlock kind="error" message="Не удалось загрузить кампании" onRetry={load} />
          : <SimpleTable testId="campaigns-table" columns={columns} rows={filtered} empty="Кампаний пока нет. Создайте первую." onRowClick={(r) => setOpenId(r._id)} />}
      </Card>

      {showCreate && <CampaignModal placements={placements} onClose={() => setShowCreate(false)} onSaved={load} />}
      {openId && <CampaignDrawer id={openId} placements={placements} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
};

export default CampaignsTab;
