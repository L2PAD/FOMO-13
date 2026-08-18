import React from 'react';
import Layout from '../../components/layouts/main_layout/layout';
import { T } from '../Statistics/ui';
import TwitterControlCenter from '../../components/layouts/twitter_layout';

const TwitterPage = () => {
    return (
        <Layout>
            <div style={{ background: T.pageBg, minHeight: '100%', padding: '20px 24px 40px' }} data-testid="twitter-page">
                <style>{`::selection{background:${T.accent};color:#fff}`}</style>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.ink, marginBottom: 16 }}>Twitter / X</div>
                <TwitterControlCenter />
            </div>
        </Layout>
    );
};

export default TwitterPage;
