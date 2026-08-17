import React, { useState } from 'react';
import { Card, SectionTitle, SimpleTable, Badge, Column } from '../../../../../pages/Statistics/ui';
import { btn } from '../../../../../pages/AccessMonetization/parts';
import CreateNewsModal from '../../modals/create_news_modal';
import CreateAcademyModal from '../../modals/create_academy_modal';
import CreateUpdateModal from '../../modals/create_update_modal';
import { INews } from '../../../../types/global_types';

const sectionMeta = (s?: string): { label: string; tone: 'good' | 'warn' | 'info' | 'default' } => {
    switch (s) {
        case 'fomo-update': return { label: 'FOMO Update', tone: 'info' };
        case 'fomo-academy': return { label: 'FOMO Academy', tone: 'warn' };
        default: return { label: 'Новость', tone: 'default' };
    }
};

const fmt = (d: any) => {
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return '—'; }
};

const MarketTab = ({ news }: { news: Array<INews> }) => {
    const [isNewsModal, setIsNewsModal] = useState(false);
    const [isAcademy, setIsAcademy] = useState(false);
    const [isUpdate, setIsUpdate] = useState(false);

    const rows = Array.isArray(news) ? news : [];

    const columns: Column<INews>[] = [
        {
            key: 'title', header: 'Заголовок', width: 420, render: (n) => (
                <div>
                    <div style={{ fontWeight: 700 }}>{n.title}</div>
                    <div style={{ color: '#64748B', fontSize: 12, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(n as any).text}
                    </div>
                </div>
            )
        },
        {
            key: 'newsSection', header: 'Тип', render: (n) => {
                const m = sectionMeta((n as any).newsSection);
                return <Badge tone={m.tone}>{m.label}</Badge>;
            }
        },
        { key: 'date', header: 'Дата', render: (n) => fmt((n as any).date) },
        {
            key: 'tags', header: 'Теги', render: (n) => {
                const tags = ((n as any).tags || []) as string[];
                return tags.length
                    ? <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{tags.slice(0, 3).map((t) => <Badge key={t} tone="default">{t}</Badge>)}</span>
                    : <span style={{ color: '#94A3B8' }}>—</span>;
            }
        },
        {
            key: 'status', header: 'Статус', render: (n) => {
                const st = (n as any).status;
                const tone = st === 'active' ? 'good' : st === 'moderator' || st === 'admin' ? 'warn' : 'default';
                return <Badge tone={tone as any}>{st === 'active' ? 'Опубликовано' : st || 'Опубликовано'}</Badge>;
            }
        },
    ];

    return (
        <div style={{ paddingTop: 8 }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <SectionTitle sub="Спарсенные новости, FOMO Updates и материалы FOMO Academy, опубликованные в Buzz.">
                        Новости
                    </SectionTitle>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button style={btn('primary')} onClick={() => setIsNewsModal(true)}>+ Новость</button>
                        <button style={btn('ghost')} onClick={() => setIsAcademy(true)}>+ FOMO Academy</button>
                        <button style={btn('ghost')} onClick={() => setIsUpdate(true)}>+ FOMO Update</button>
                    </div>
                </div>
                <div style={{ marginTop: 14 }}>
                    <SimpleTable columns={columns} rows={rows} empty="Новостей пока нет" testId="market-news-table" />
                </div>
            </Card>

            {isNewsModal && <CreateNewsModal onClose={() => setIsNewsModal(false)} />}
            {isAcademy && <CreateAcademyModal onClose={() => setIsAcademy(false)} />}
            {isUpdate && <CreateUpdateModal onClose={() => setIsUpdate(false)} />}
        </div>
    );
};

export default MarketTab;
