import React, { useState } from 'react';
import { Card, SectionTitle, SimpleTable, Badge, StateBlock, Column, useAsync } from '../../../../../pages/Statistics/ui';
import { input, btn } from '../../../../../pages/AccessMonetization/parts';
import { ITwitterAcc } from '../../../../types/global_types';
import AddTwitterUserModal from '../../modals/add_twitter_user_modal';
import UpdateTwitterUserModal from '../../modals/update_twitter_user_modal';
import AddTwitterKeywordsModal from '../../modals/add_twitter_keywords_modal';
import AddCategoryModal from '../../modals/add_category_modal';
import { fetchData } from '../../../../hooks/useFetch';

const ParcingTab = () => {
    const [search, setSearch] = useState('');
    const [isAddTwitterModal, setIsAddTwitterModal] = useState(false);
    const [isAddKeywordsModal, setIsAddKeywordsModal] = useState(false);
    const [isUpdateTwitterModal, setIsUpdateTwitterModal] = useState(false);
    const [isCreateCategory, setIsCreateCategory] = useState(false);

    const { data, loading, error, refetch } = useAsync<ITwitterAcc[]>(async () => {
        const r = await fetchData('socialparcing');
        return Array.isArray(r?.data) ? r.data : [];
    }, []);

    const accounts = (data || []).filter((a: any) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (a.name || a.userName || a.screenName || '').toLowerCase().includes(q);
    });

    const columns: Column<ITwitterAcc>[] = [
        {
            key: 'account', header: 'Аккаунт', width: 320, render: (a: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {a.image ? <img src={a.image} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} /> : null}
                    <div>
                        <div style={{ fontWeight: 700 }}>{a.name || a.userName || a.screenName || '—'}</div>
                        <div style={{ color: '#64748B', fontSize: 12 }}>@{a.userName || a.screenName || a.name}</div>
                    </div>
                </div>
            )
        },
        { key: 'category', header: 'Категория', render: (a: any) => a.category ? <Badge tone="info">{a.category}</Badge> : <span style={{ color: '#94A3B8' }}>—</span> },
        { key: 'keywords', header: 'Ключевые слова', render: (a: any) => <Badge tone="default">{Array.isArray(a.keywords) ? a.keywords.length : 0}</Badge> },
        { key: 'actions', header: '', render: () => <button style={btn('ghost')} onClick={() => setIsUpdateTwitterModal(true)}>Изменить</button> },
    ];

    return (
        <div style={{ paddingTop: 8 }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <SectionTitle sub="Источники Twitter/X для парсера новостей. Сам парсер работает отдельно — здесь управление аккаунтами, ключевыми словами и категориями.">
                        Источники парсинга
                    </SectionTitle>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button style={btn('primary')} onClick={() => setIsAddTwitterModal(true)}>+ Twitter аккаунт</button>
                        <button style={btn('ghost')} onClick={() => setIsAddKeywordsModal(true)}>+ Ключевые слова</button>
                        <button style={btn('ghost')} onClick={() => setIsCreateCategory(true)}>Категории</button>
                    </div>
                </div>
                <div style={{ margin: '14px 0' }}>
                    <input style={{ ...input, maxWidth: 320 }} placeholder="Поиск аккаунта" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                {loading ? <StateBlock kind="loading" /> : error ? <StateBlock kind="error" onRetry={refetch} /> : (
                    <SimpleTable columns={columns} rows={accounts} empty="Источников пока нет" testId="parcing-table" />
                )}
            </Card>

            {isAddTwitterModal && <AddTwitterUserModal onClose={() => setIsAddTwitterModal(false)} />}
            {isAddKeywordsModal && <AddTwitterKeywordsModal onClose={() => setIsAddKeywordsModal(false)} />}
            {isUpdateTwitterModal && <UpdateTwitterUserModal onClose={() => setIsUpdateTwitterModal(false)} />}
            {isCreateCategory && <AddCategoryModal onClose={() => setIsCreateCategory(false)} />}
        </div>
    );
};

export default ParcingTab;
