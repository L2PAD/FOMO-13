import React from 'react';
import Layout from '../../components/layouts/main_layout/layout';
import { T } from '../Statistics/ui';
import { AiControlCenter } from '../AccessMonetization/aiCenter';

const FomoAiPage: React.FC = () => {
  return (
    <Layout>
      <div style={{ background: T.pageBg, minHeight: '100%', padding: '28px 28px 48px' }} data-testid="fomo-ai-page">
        <style>{`::selection{background:${T.accent};color:#fff}`}</style>
        <AiControlCenter />
      </div>
    </Layout>
  );
};

export default FomoAiPage;
