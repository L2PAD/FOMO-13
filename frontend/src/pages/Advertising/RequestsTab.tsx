import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { T, Card, SimpleTable, Badge, StateBlock, Column, fmtDate } from '../Statistics/ui';
import OptionSelect from './OptionSelect';
import AdPreview from './AdPreview';
import {
  listAdRequests, updateAdRequestStatus, aiGenerateRequestCampaign,
  approveRequestCampaign, rejectRequestCampaign, getCampaign,
} from '../../components/services/advertising';

const statusMeta: Record<string, { label: string; tone: 'good' | 'bad' | 'warn' | 'info' | 'default' }> = {
  new: { label: 'Новая', tone: 'info' },
  in_review: { label: 'В работе', tone: 'warn' },
  approved: { label: 'Одобрена', tone: 'good' },
  rejected: { label: 'Отклонена', tone: 'bad' },
};

const AD_TYPE_LABEL: Record<string, string> = {
  banner_global: 'Сквозной баннер (шапка)', homepage: 'Главная страница', local: 'Локально в разделе',
  floating: 'Плавающий баннер', sponsored: 'Спонсорский пост', newsletter: 'Рассылка', other: 'Другое',
};

const daysSince = (d?: string) => (d ? Math.max(0, Math.floor((Date.now() - +new Date(d)) / 864e5)) : 0);

const btn = (bg: string, color = '#fff'): React.CSSProperties => ({ padding: '10px 16px', borderRadius: 10, border: 'none', background: bg, color, fontWeight: 800, fontSize: 13, cursor: 'pointer' });
const ghost: React.CSSProperties = { padding: '10px 16px', borderRadius: 10, border: `1px solid ${T.border}`, background: '#fff', color: T.sub, fontWeight: 700, fontSize: 13, cursor: 'pointer' };

/* ── AI campaign panel inside the request drawer ── */
const AiCampaignPanel: React.FC<{ r: any; onChanged: () => void }> = ({ r, onChanged }) => {
  const [busy, setBusy] = useState('');
  const [campaign, setCampaign] = useState<any>(null);

  const loadCampaign = useCallback(async () => {
    if (!r.linkedCampaignId) { setCampaign(null); return; }
    const res = await getCampaign(r.linkedCampaignId);
    if (res.success) setCampaign(res.data);
  }, [r.linkedCampaignId]);
  useEffect(() => { loadCampaign(); }, [loadCampaign]);

  const generate = async () => {
    setBusy('gen');
    const res = await aiGenerateRequestCampaign(r._id);
    setBusy('');
    if (res.success) { toast.success(res.data?.usedAi ? 'ИИ создал кампанию' : 'Создан шаблон (ИИ недоступен)'); onChanged(); }
    else toast.error(res.data?.message || 'Не удалось сгенерировать');
  };
  const approve = async () => {
    setBusy('approve');
    const res = await approveRequestCampaign(r._id);
    setBusy('');
    if (res.success) { toast.success('Кампания одобрена и запущена'); onChanged(); }
    else toast.error(res.data?.message || 'Ошибка');
  };
  const reject = async () => {
    setBusy('reject');
    const res = await rejectRequestCampaign(r._id);
    setBusy('');
    if (res.success) { toast.success('Заявка отклонена'); onChanged(); }
    else toast.error(res.data?.message || 'Ошибка');
  };

  const cr = campaign?.creatives?.[0];

  return (
    <Card testId="ai-campaign-panel" style={{ padding: 16, marginBottom: 14, border: `1px solid ${T.accent}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>ИИ-кампания под заявку</div>
        {r.aiStatus === 'generated' ? <Badge tone="good">Черновик готов</Badge> : r.aiStatus === 'generating' ? <Badge tone="warn">Генерация…</Badge> : <Badge tone="default">Не создана</Badge>}
      </div>
      <div style={{ fontSize: 12.5, color: T.sub, marginBottom: 12 }}>
        ИИ (Claude) читает заявку и формирует черновик рекламной кампании. Затем вы одобряете (запуск), отклоняете или редактируете кампанию во вкладке «Кампании».
      </div>

      {!r.linkedCampaignId ? (
        <button style={btn(T.accent)} onClick={generate} disabled={!!busy} data-testid="ai-generate-btn">
          {busy === 'gen' ? 'Генерация…' : '✨ Сгенерировать кампанию (AI)'}
        </button>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {campaign ? (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 800, color: T.ink }}>{campaign.name}</div>
                <Badge tone={statusMeta[campaign.status]?.tone || (campaign.status === 'active' ? 'good' : campaign.status === 'cancelled' ? 'bad' : 'default')}>{campaign.status}</Badge>
              </div>
              <div style={{ fontSize: 11.5, color: T.faint, marginBottom: 10 }}>Плейсменты: {(campaign.placements || []).join(', ') || '—'} · {r.aiNote || ''}</div>
              {cr ? <AdPreview creative={cr} format={cr.displaySize === 'compact' ? 'compact' : 'expanded'} /> : <div style={{ fontSize: 12.5, color: T.sub }}>Креатив не найден.</div>}
            </div>
          ) : <StateBlock kind="loading" height={60} />}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button style={btn('#16A34A')} onClick={approve} disabled={!!busy || r.status === 'approved'} data-testid="ai-approve-btn">{busy === 'approve' ? '…' : '✓ Одобрить и запустить'}</button>
            <button style={btn(T.bad || '#DC2626')} onClick={reject} disabled={!!busy || r.status === 'rejected'} data-testid="ai-reject-btn">{busy === 'reject' ? '…' : '✕ Отклонить'}</button>
            <button style={ghost} onClick={generate} disabled={!!busy} data-testid="ai-regenerate-btn">{busy === 'gen' ? '…' : '↻ Перегенерировать'}</button>
          </div>
          <div style={{ fontSize: 11.5, color: T.faint }}>Редактировать кампанию можно во вкладке «Кампании» (найдите её по названию «{campaign?.name || r.projectName}»).</div>
        </div>
      )}
    </Card>
  );
};

/* ── Client 360 detail drawer ── */
const RequestDrawer: React.FC<{ r: any; onClose: () => void; onStatus: (id: string, s: string) => void; onChanged: () => void }> = ({ r, onClose, onStatus, onChanged }) => {
  const Field: React.FC<{ k: string; v: any; link?: boolean }> = ({ k, v, link }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: `1px solid ${T.soft}` }}>
      <span style={{ fontSize: 12.5, color: T.sub }}>{k}</span>
      {link && v ? <a href={String(v).startsWith('http') ? v : `https://${v}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 700, color: T.accent, textAlign: 'right', wordBreak: 'break-all' }}>{v}</a>
        : <span style={{ fontSize: 13, fontWeight: 700, color: T.ink, textAlign: 'right', wordBreak: 'break-word' }}>{v || '—'}</span>}
    </div>
  );
  const c360: { k: string; v: string; tag?: string }[] = [
    { k: 'Заявленный бюджет', v: r.budget || '—', tag: 'Заявка' },
    { k: 'Дней с момента заявки', v: String(daysSince(r.createdAt)), tag: 'Факт' },
    { k: 'Статус показа', v: r.status === 'approved' ? 'Запущена' : r.status === 'rejected' ? 'Отклонена' : 'Не запущен', tag: 'Расчёт' },
  ];
  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(11,18,32,0.5)', zIndex: 4000, display: 'flex', justifyContent: 'flex-end' }} data-testid="request-drawer">
      <div style={{ width: '100%', maxWidth: 480, height: '100%', background: '#fff', overflowY: 'auto', padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, color: T.ink }}>{r.projectName}</div>
            <div style={{ fontSize: 12.5, color: T.faint, marginTop: 2 }}>{AD_TYPE_LABEL[r.adType] || 'Тип не указан'} · {fmtDate(r.createdAt)}</div>
          </div>
          <button onClick={onClose} style={{ border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: 18, color: T.sub }}>×</button>
        </div>
        <div style={{ marginTop: 8, marginBottom: 16 }}><Badge tone={statusMeta[r.status]?.tone || 'default'}>{statusMeta[r.status]?.label || r.status}</Badge></div>

        <AiCampaignPanel r={r} onChanged={onChanged} />

        <Card style={{ padding: 16, marginBottom: 14, background: 'linear-gradient(180deg,#F6F4FF,#fff)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 6 }}>Клиент 360</div>
          {c360.map((x) => (
            <div key={x.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.soft}` }}>
              <span style={{ fontSize: 12.5, color: T.sub }}>{x.k}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: T.ink }}>{x.v}</span>
                {x.tag ? <Badge tone={x.tag === 'Факт' ? 'good' : x.tag === 'Заявка' ? 'info' : 'default'}>{x.tag}</Badge> : null}
              </span>
            </div>
          ))}
        </Card>

        <Card style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 6 }}>Информация о проекте</div>
          <Field k="Email" v={r.email} />
          <Field k="Контактное лицо" v={r.contactName} />
          <Field k="Telegram" v={r.telegram} />
          <Field k="Сайт" v={r.website} link />
          <Field k="Тип рекламы" v={AD_TYPE_LABEL[r.adType] || r.adType} />
          <Field k="Желаемое размещение" v={r.placement} />
          <Field k="Источник (страница)" v={r.source} />
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12.5, color: T.sub, marginBottom: 4 }}>О проекте / сообщение</div>
            <div style={{ fontSize: 13, color: T.ink, lineHeight: '19px', background: T.soft, borderRadius: 10, padding: 12 }}>{r.message || '—'}</div>
          </div>
        </Card>

        <div style={{ marginBottom: 8, fontSize: 12.5, color: T.sub, fontWeight: 700 }}>Статус заявки (вручную)</div>
        <OptionSelect label="" value={r.status} onChange={(v) => onStatus(r._id, v)} options={Object.keys(statusMeta).map((s) => ({ value: s, label: statusMeta[s].label }))} />
      </div>
    </div>
  );
};

const RequestsTab: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    const r = await listAdRequests(filter);
    if (r.success) {
      setRows(r.data);
      setSelected((s: any) => (s ? (r.data.find((x: any) => x._id === s._id) || null) : null));
    } else setError(true);
    setLoading(false);
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id: string, status: string) => {
    const r = await updateAdRequestStatus(id, status);
    if (r.success) { toast.success('Статус обновлён'); load(); } else toast.error('Ошибка');
  };

  const columns: Column<any>[] = [
    { key: 'project', header: 'Проект', render: (r) => (<div><div style={{ fontWeight: 700, color: T.ink }}>{r.projectName}</div><div style={{ fontSize: 11, color: T.faint }}>{r.email}{r.telegram ? ` · ${r.telegram}` : ''}</div></div>) },
    { key: 'adType', header: 'Тип', render: (r) => <span style={{ color: T.sub, fontSize: 12.5 }}>{AD_TYPE_LABEL[r.adType] || '—'}</span> },
    { key: 'ai', header: 'ИИ', render: (r) => r.aiStatus === 'generated' ? <Badge tone="good">Черновик</Badge> : r.aiStatus === 'generating' ? <Badge tone="warn">…</Badge> : <span style={{ color: T.faint }}>—</span> },
    { key: 'budget', header: 'Бюджет', render: (r) => <span style={{ color: T.sub }}>{r.budget || '—'}</span> },
    { key: 'date', header: 'Дата', render: (r) => <span style={{ color: T.sub }}>{fmtDate(r.createdAt)}</span> },
    { key: 'status', header: 'Статус', render: (r) => <Badge tone={statusMeta[r.status]?.tone || 'default'}>{statusMeta[r.status]?.label || r.status}</Badge> },
    { key: 'actions', header: 'Действие', render: (r) => (
      <button data-testid={`request-open-${r._id}`} onClick={(e) => { e.stopPropagation(); setSelected(r); }}
        style={{ padding: '7px 13px', borderRadius: 9, border: `1px solid ${T.accent}`, background: '#EEF2FF', color: T.accent, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>Открыть</button>) },
  ];

  const seg = (active: boolean): React.CSSProperties => ({ padding: '8px 12px', borderRadius: 9, border: `1px solid ${active ? T.accent : T.border}`, background: active ? '#EEF2FF' : '#fff', color: active ? T.accent : T.sub, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' });

  return (
    <div style={{ display: 'grid', gap: 16 }} data-testid="ads-requests">
      <Card style={{ padding: 16 }}>
        <div style={{ fontSize: 14, color: T.sub, marginBottom: 12 }}>Заявки на размещение рекламы с публичного сайта (кнопка «Your ad here»). ИИ формирует черновик кампании под заявку — вы одобряете, отклоняете или редактируете.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button style={seg(filter === '')} onClick={() => setFilter('')}>Все</button>
          {Object.keys(statusMeta).map((s) => <button key={s} style={seg(filter === s)} onClick={() => setFilter(s)}>{statusMeta[s].label}</button>)}
        </div>
      </Card>
      <Card style={{ padding: 8 }}>
        {loading ? <div style={{ padding: 16 }}><StateBlock kind="loading" /></div>
          : error ? <StateBlock kind="error" message="Не удалось загрузить заявки" onRetry={load} />
          : <SimpleTable testId="requests-table" columns={columns} rows={rows} empty="Заявок пока нет." />}
      </Card>
      {selected ? <RequestDrawer r={selected} onClose={() => setSelected(null)} onStatus={changeStatus} onChanged={load} /> : null}
    </div>
  );
};

export default RequestsTab;
