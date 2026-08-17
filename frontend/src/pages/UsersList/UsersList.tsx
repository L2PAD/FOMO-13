import React, { useState } from 'react';
import Layout from '../../components/layouts/main_layout/layout';
import { T } from '../Statistics/ui';
import MasterList from './MasterList';
import Invitations from './Invitations';

const UsersListPage = () => {
    const [tab, setTab] = useState<'all' | 'invites'>('all');
    return (
        <Layout>
            <div style={{ background: T.pageBg, minHeight: '100%', padding: '20px 0 0' }} data-testid="users-list-page">
                <style>{`::selection{background:${T.accent};color:#fff}`}</style>
                <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${T.border}`, margin: '0 20px 18px' }} role="tablist">
                    {([['all', 'Все пользователи'], ['invites', 'Приглашения']] as [typeof tab, string][]).map(([k, l]) => (
                        <button key={k} onClick={() => setTab(k)} data-testid={`users-tab-${k}`}
                            style={{ background: 'none', border: 'none', padding: '10px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: tab === k ? T.accent : T.sub, borderBottom: tab === k ? `2px solid ${T.accent}` : '2px solid transparent', marginBottom: -1 }}>
                            {l}
                        </button>
                    ))}
                </div>
                {tab === 'all' ? <MasterList /> : <div style={{ padding: '0 20px' }}><Invitations /></div>}
            </div>
        </Layout>
    );
};

export default UsersListPage;
