import React from 'react';
import Layout from '../../components/layouts/main_layout/layout';
import { T, PageHeader } from '../Statistics/ui';
import { SpaceportControlCenter } from './SpaceportControlCenter';

const SUBTITLE =
  'NFT Asset / Spaceport Control Center: полный жизненный цикл NFT вокруг существующих контрактов (BSC Testnet, chainId 97) — продажи, держатели, токены, reveal, передачи, access-benefit, контроль контракта и сверка с блокчейном. Смарт-контракты не изменяются.';

const SpaceportPage: React.FC = () => (
  <Layout>
    <div style={{ background: T.pageBg, minHeight: '100%', padding: '28px 28px 48px' }} data-testid="spaceport-page">
      <style>{`::selection{background:${T.accent};color:#fff}`}</style>
      <PageHeader title="Spaceport / NFT Assets" subtitle={SUBTITLE} testIdPrefix="spaceport" />
      <SpaceportControlCenter />
    </div>
  </Layout>
);

export default SpaceportPage;
