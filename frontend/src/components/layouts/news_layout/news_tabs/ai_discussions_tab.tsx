import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
    fetchBuzzAiSettings,
    updateBuzzAiSettings,
    fetchBuzzAiBudget,
    IBuzzAiSettings,
    IBuzzAiBudget,
} from '../../../services/buzz/buzzAi';

const GREEN = '#04A584';
const BORDER = '#E6E9EF';
const SUB = '#6B7280';
const INK = '#0B1020';

const card: React.CSSProperties = { border: `1px solid ${BORDER}`, borderRadius: 12, background: '#fff', padding: 18, marginBottom: 16 };
const title: React.CSSProperties = { fontSize: 15, fontWeight: 800, color: INK, marginBottom: 12 };
const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: `1px solid ${BORDER}` };
const numField: React.CSSProperties = { width: 120, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 10px', fontSize: 14 };

const Toggle = ({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!on)} data-testid="buzz-ai-toggle"
        style={{ width: 46, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer', background: on ? GREEN : '#CBD2DC', position: 'relative', transition: 'background .15s' }}>
        <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
    </button>
);

const NUM_FIELDS: Array<{ key: keyof IBuzzAiSettings; label: string }> = [
    { key: 'minComments', label: 'Мин. комментариев для AUTO' },
    { key: 'minUniqueParticipants', label: 'Мин. уникальных участников' },
    { key: 'cooldownSec', label: 'Кулдаун между AI-ответами (сек)' },
    { key: 'maxRepliesPerThread', label: 'Макс. AI-ответов на тред' },
    { key: 'maxRepliesPerDay', label: 'Макс. AI-ответов в день' },
    { key: 'dailyCogsUsdLimit', label: 'Дневной лимит COGS ($)' },
    { key: 'monthlyCogsUsdLimit', label: 'Месячный лимит COGS ($)' },
];

const AiDiscussionsTab = () => {
    const [s, setS] = useState<IBuzzAiSettings | null>(null);
    const [budget, setBudget] = useState<IBuzzAiBudget | null>(null);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        const [r1, r2] = await Promise.all([fetchBuzzAiSettings(), fetchBuzzAiBudget()]);
        if (r1.success) setS(r1.data);
        if (r2.success) setBudget(r2.data);
    };
    useEffect(() => { load(); }, []);

    const save = async () => {
        if (!s) return;
        setSaving(true);
        const res = await updateBuzzAiSettings(s);
        setSaving(false);
        if (!res.success) return toast.error('Не удалось сохранить настройки');
        toast.success('Настройки сохранены');
        load();
    };

    if (!s) return <div style={{ padding: 20, color: SUB }}>Загрузка…</div>;

    return (
        <div style={{ maxWidth: 760 }} data-testid="ai-discussions-tab">
            <div style={{ color: SUB, fontSize: 13, marginBottom: 16 }}>
                Управление участием FOMO AI в обсуждениях Buzz. Все AI-операции идут через внутренний FOMO AI Gateway.
                Ключ OpenAI здесь не задаётся — см. <a href="/admin/settings" style={{ color: GREEN, fontWeight: 700 }}>Настройки → AI</a>.
            </div>

            <div style={card}>
                <div style={title}>Режимы</div>
                <div style={{ ...rowStyle, borderTop: 'none' }}>
                    <div><strong>Авто-ответы (AUTO)</strong><div style={{ color: SUB, fontSize: 12 }}>FOMO AI отвечает по правилам ниже</div></div>
                    <Toggle on={s.autoReplyEnabled} onChange={(v) => setS({ ...s, autoReplyEnabled: v })} />
                </div>
                <div style={rowStyle}>
                    <div><strong>Упоминания @FOMOAI</strong><div style={{ color: SUB, fontSize: 12 }}>Ответ при прямом упоминании в треде</div></div>
                    <Toggle on={s.mentionsEnabled} onChange={(v) => setS({ ...s, mentionsEnabled: v })} />
                </div>
            </div>

            <div style={card}>
                <div style={title}>Лимиты и бюджеты</div>
                {NUM_FIELDS.map((f, i) => (
                    <div key={f.key as string} style={{ ...rowStyle, ...(i === 0 ? { borderTop: 'none' } : {}) }}>
                        <div>{f.label}</div>
                        <input type="number" style={numField} value={(s as any)[f.key]}
                            onChange={(e) => setS({ ...s, [f.key]: Number(e.target.value) } as IBuzzAiSettings)} />
                    </div>
                ))}
            </div>

            {budget && (
                <div style={card}>
                    <div style={title}>Текущий расход (COGS)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14 }}>
                            <div style={{ color: SUB, fontSize: 12 }}>Сегодня</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: INK }}>${budget.daySpendUsd.toFixed(4)}</div>
                            <div style={{ color: SUB, fontSize: 12 }}>из ${budget.dailyCogsUsdLimit} · остаток ${budget.dayRemainingUsd.toFixed(4)}</div>
                        </div>
                        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14 }}>
                            <div style={{ color: SUB, fontSize: 12 }}>Этот месяц</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: INK }}>${budget.monthSpendUsd.toFixed(4)}</div>
                            <div style={{ color: SUB, fontSize: 12 }}>из ${budget.monthlyCogsUsdLimit} · остаток ${budget.monthRemainingUsd.toFixed(4)}</div>
                        </div>
                    </div>
                </div>
            )}

            <button onClick={save} disabled={saving} data-testid="buzz-ai-save"
                style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: 8, padding: '11px 22px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Сохранение…' : 'Сохранить настройки'}
            </button>
        </div>
    );
};

export default AiDiscussionsTab;
