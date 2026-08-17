import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  T, Card, SectionTitle, KpiGrid, KpiCard,
  SimpleTable, Badge, StateBlock, useAsync, fmtDate, shortId, Column,
} from '../Statistics/ui';
import { NftAccessCenter } from '../AccessMonetization/nftAccess';
import { useWallet } from '../../components/wallet/WalletProvider';
import * as api from './service';

const LIVE_GREEN = '#04A584';

const SUBTABS = [
  { key: 'overview', label: 'Обзор' },
  { key: 'collections', label: 'Коллекции' },
  { key: 'sales', label: 'Продажи' },
  { key: 'holders', label: 'Держатели' },
  { key: 'tokens', label: 'Токены' },
  { key: 'reveal', label: 'Reveal' },
  { key: 'fusion', label: 'Fusion' },
  { key: 'transfers', label: 'Передачи' },
  { key: 'benefits', label: 'Access Benefits' },
  { key: 'control', label: 'Contract Control' },
  { key: 'diagnostics', label: 'Диагностика' },
];

const Addr: React.FC<{ addr?: string | null; explorer?: string; kind?: 'address' | 'tx' }> = ({ addr, explorer, kind = 'address' }) => {
  if (!addr) return <span style={{ color: T.faint }}>—</span>;
  const href = explorer ? `${explorer}/${kind === 'tx' ? 'tx' : 'address'}/${addr}` : undefined;
  const label = shortId(addr, 14);
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" style={{ color: T.accent, fontWeight: 600, textDecoration: 'none', fontFamily: 'Source Code Pro, monospace' }}>{label}</a>
  ) : (
    <span style={{ fontFamily: 'Source Code Pro, monospace' }}>{label}</span>
  );
};

const LiveDot: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: ok ? LIVE_GREEN : T.bad }}>
    <span style={{ width: 8, height: 8, borderRadius: 999, background: ok ? LIVE_GREEN : T.bad, boxShadow: ok ? `0 0 0 3px ${LIVE_GREEN}22` : 'none' }} />
    {label}
  </span>
);

const OverviewSub: React.FC = () => {
  const { data, loading, error, refetch } = useAsync(() => api.getOverview(), []);
  if (loading) return <Card><StateBlock kind="loading" /></Card>;
  if (error) return <Card><StateBlock kind="error" message={error} onRetry={refetch} /></Card>;
  const d = data || {};
  const net = d.network || {};
  const sale = d.sale || {};
  const supply = d.supply || {};
  const rev = d.revenue || {};
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{net.name} · chainId {net.chainId}</div>
            <div style={{ fontSize: 12.5, color: T.sub, marginTop: 4 }}>RPC источник: {d.registrySource} · live read-only</div>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <LiveDot ok={!!d.rpc?.ok} label={d.rpc?.ok ? `RPC LIVE · блок ${d.rpc?.latestBlock}` : 'RPC недоступен'} />
            <Badge tone={d.saleState === 'ACTIVE' ? 'good' : d.saleState === 'PAUSED' ? 'warn' : 'default'}>Продажа: {d.saleState}</Badge>
            <Badge tone="info">Genesis: {d.genesis?.status}</Badge>
          </div>
        </div>
      </Card>
      <KpiGrid>
        <KpiCard testId="sp-kpi-minted" label="Минтед / макс" value={`${supply.minted ?? '—'} / ${supply.max ?? '—'}`} hint={`Осталось: ${supply.remaining ?? '—'}`} />
        <KpiCard testId="sp-kpi-holders" label="Уник. держатели" value={d.holders?.unique ?? '—'} hint={`Мульти-холдеры: ${d.holders?.multiHolders ?? 0}`} />
        <KpiCard testId="sp-kpi-price" label="Цена" value={sale.price != null ? `${sale.price} ${rev.currency || 'USDT'}` : '—'} hint={`Макс/кошелёк: ${sale.maxPerWallet ?? '—'}`} />
        <KpiCard testId="sp-kpi-reveal" label="Reveal rate" value={`${d.reveal?.revealRate ?? 0}%`} hint={`Revealed: ${d.reveal?.revealed ?? 0} · PreMint: ${d.reveal?.preMint ?? 0}`} />
        <KpiCard testId="sp-kpi-rev-lifetime" label="Выручка (всё время)" value={`${(rev.lifetime ?? 0).toLocaleString()} ${rev.currency || 'USDT'}`} hint={`Покупателей: ${rev.buyers ?? 0}`} tone="good" />
        <KpiCard testId="sp-kpi-rev-30" label="Выручка 30д / 7д" value={`${(rev.d30 ?? 0).toLocaleString()} / ${(rev.d7 ?? 0).toLocaleString()}`} hint={`Заказов: ${rev.orders ?? 0}`} />
        <KpiCard testId="sp-kpi-staked" label="В стейкинге" value={d.staking?.stakedTokens ?? 0} hint="токенов" />
        <KpiCard testId="sp-kpi-supply" label="Текущий supply" value={supply.currentSupply ?? '—'} hint={`nextTokenId: ${d.nft?.nextTokenId ?? '—'}`} />
      </KpiGrid>
      <Card>
        <SectionTitle sub="Живые данные контракта продажи (owner-signed управление — во вкладке Contract Control)">Контракт продажи</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12, fontSize: 13 }}>
          <div><div style={{ color: T.sub, fontSize: 12 }}>Owner</div><Addr addr={sale.owner} explorer={net.explorerUrl} /></div>
          <div><div style={{ color: T.sub, fontSize: 12 }}>Payment token</div><Addr addr={sale.paymentToken} explorer={net.explorerUrl} /></div>
          <div><div style={{ color: T.sub, fontSize: 12 }}>NFT контракт</div><Addr addr={sale.nftContract} explorer={net.explorerUrl} /></div>
          <div><div style={{ color: T.sub, fontSize: 12 }}>Sale адрес</div><Addr addr={sale.address} explorer={net.explorerUrl} /></div>
        </div>
      </Card>
    </div>
  );
};

const CollectionsSub: React.FC = () => {
  const { data, loading, error, refetch } = useAsync(() => api.getCollections(), []);
  if (loading) return <Card><StateBlock kind="loading" /></Card>;
  if (error) return <Card><StateBlock kind="error" message={error} onRetry={refetch} /></Card>;
  const cols = data?.collections || [];
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {cols.map((c: any) => (
        <Card key={c.role} testId={`sp-collection-${c.role}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{c.label}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Badge tone={c.kind === 'NOT_CONFIGURED' ? 'warn' : 'info'}>{c.kind}</Badge>
              <span style={{ fontSize: 12, color: T.sub }}>{c.network?.name} · {c.network?.chainId}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10, marginTop: 12, fontSize: 13 }}>
            <div><div style={{ color: T.sub, fontSize: 12 }}>Адрес</div>{c.address ? <Addr addr={c.address} explorer={c.network?.explorerUrl} /> : <Badge tone="warn">NOT_CONFIGURED</Badge>}</div>
            {c.owner !== undefined && <div><div style={{ color: T.sub, fontSize: 12 }}>Owner</div><Addr addr={c.owner} explorer={c.network?.explorerUrl} /></div>}
            {c.name && <div><div style={{ color: T.sub, fontSize: 12 }}>Имя</div>{c.name} {c.symbol ? `(${c.symbol})` : ''}</div>}
            {c.totalSupply != null && <div><div style={{ color: T.sub, fontSize: 12 }}>Supply</div>{c.totalSupply}{c.maxSupply ? ` / ${c.maxSupply}` : ''}</div>}
            {c.price != null && <div><div style={{ color: T.sub, fontSize: 12 }}>Цена</div>{c.price}</div>}
            {c.maxPerWallet != null && <div><div style={{ color: T.sub, fontSize: 12 }}>Макс/кошелёк</div>{c.maxPerWallet}</div>}
            {c.salePaused != null && <div><div style={{ color: T.sub, fontSize: 12 }}>Статус</div><Badge tone={c.salePaused ? 'warn' : 'good'}>{c.salePaused ? 'PAUSED' : 'ACTIVE'}</Badge></div>}
            {c.decimals != null && <div><div style={{ color: T.sub, fontSize: 12 }}>Decimals</div>{c.decimals}</div>}
          </div>
          {Array.isArray(c.writeCapabilities) && c.writeCapabilities.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ color: T.sub, fontSize: 12, marginBottom: 6 }}>ABI write-методы (owner-signed)</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {c.writeCapabilities.map((w: any) => <Badge key={w.method} tone="default">{w.label}</Badge>)}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

const SalesSub: React.FC = () => {
  const { data, loading, error, refetch } = useAsync(() => api.getSales(), []);
  if (loading) return <Card><StateBlock kind="loading" /></Card>;
  if (error) return <Card><StateBlock kind="error" message={error} onRetry={refetch} /></Card>;
  const rev = data?.revenue || {};
  const cur = data?.currency || 'USDT';
  const columns: Column<any>[] = [
    { key: 'walletAddress', header: 'Кошелёк', render: (r) => <Addr addr={r.walletAddress} /> },
    { key: 'quantity', header: 'Кол-во', align: 'right' },
    { key: 'paid', header: `Оплачено (${cur})`, align: 'right', render: (r) => (r.paid ?? 0).toLocaleString() },
    { key: 'referralAddress', header: 'Реферал', render: (r) => <Addr addr={r.referralAddress} /> },
    { key: 'txHash', header: 'Tx', render: (r) => <Addr addr={r.txHash} kind="tx" /> },
    { key: 'purchasedAt', header: 'Дата', render: (r) => fmtDate(r.purchasedAt) },
  ];
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <KpiGrid>
        <KpiCard label="Выручка (всё время)" value={`${(rev.lifetime ?? 0).toLocaleString()} ${cur}`} tone="good" />
        <KpiCard label="30 дней" value={`${(rev.d30 ?? 0).toLocaleString()} ${cur}`} />
        <KpiCard label="7 дней" value={`${(rev.d7 ?? 0).toLocaleString()} ${cur}`} />
        <KpiCard label="Покупатели" value={rev.buyers ?? 0} hint={`Заказов: ${rev.orders ?? 0}`} />
        <KpiCard label="NFT продано" value={rev.unitsSold ?? 0} hint={`Ср. заказ: ${(rev.avgOrder ?? 0).toFixed(1)} ${cur}`} />
      </KpiGrid>
      <Card>
        <SectionTitle sub={`Записи покупок (backend). Индексировано Purchased-событий: ${data?.indexedPurchasedEvents ?? 0}. Выручка нормализована по chain decimals (${data?.decimals}).`}>Покупки</SectionTitle>
        <SimpleTable columns={columns} rows={data?.purchases || []} empty="Покупок пока нет" testId="sp-sales-table" />
      </Card>
    </div>
  );
};

const HoldersSub: React.FC = () => {
  const history = useHistory();
  const { data, loading, error, refetch } = useAsync(() => api.getHolders(), []);
  if (loading) return <Card><StateBlock kind="loading" /></Card>;
  if (error) return <Card><StateBlock kind="error" message={error} onRetry={refetch} /></Card>;
  const seg = data?.segments || {};
  const columns: Column<any>[] = [
    { key: 'wallet', header: 'Кошелёк', render: (r) => <Addr addr={r.wallet} /> },
    { key: 'name', header: 'Пользователь', render: (r) => r.name || r.email || <span style={{ color: T.faint }}>гость</span> },
    { key: 'tokenCount', header: 'Токенов', align: 'right', render: (r) => <Badge tone="info">{r.tokenCount}</Badge> },
    { key: 'tokenIds', header: 'Token IDs', render: (r) => (r.tokenIds || []).join(', ') },
    { key: 'go', header: '', align: 'right', render: (r) => r.userId ? <span style={{ color: T.accent, fontWeight: 700 }}>Customer 360 →</span> : null },
  ];
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <KpiGrid>
        <KpiCard label="Уник. держатели" value={data?.uniqueHolders ?? 0} />
        <KpiCard label="Мульти-холдеры" value={data?.multiHolders ?? 0} />
        <KpiCard label="1 NFT" value={seg.s1 ?? 0} />
        <KpiCard label="2 / 3 NFT" value={`${seg.s2 ?? 0} / ${seg.s3 ?? 0}`} />
        <KpiCard label="4+ NFT" value={seg.s4plus ?? 0} tone="good" />
      </KpiGrid>
      <Card>
        <SectionTitle sub="Текущее владение из ERC721 enumeration (live). Клик по строке → Customer 360.">Держатели</SectionTitle>
        <SimpleTable columns={columns} rows={data?.holders || []} empty="Держателей нет" testId="sp-holders-table" onRowClick={(r) => { if (r.userId) history.push(`/users_list/user/${r.userId}`); }} />
      </Card>
    </div>
  );
};

const TokensSub: React.FC = () => {
  const [search, setSearch] = useState('');
  const { data, loading, error, refetch } = useAsync(() => api.getTokens(search), []);
  const columns: Column<any>[] = [
    { key: 'tokenId', header: 'Token ID', render: (r) => <b>#{r.tokenId}</b> },
    { key: 'owner', header: 'Владелец', render: (r) => <Addr addr={r.owner} /> },
    { key: 'rarityName', header: 'Редкость', render: (r) => <Badge tone={r.rarityId >= 4 ? 'good' : r.rarityId >= 1 ? 'warn' : 'default'}>{r.rarityName || '—'}</Badge> },
    { key: 'isStaked', header: 'Стейк', render: (r) => r.isStaked ? <Badge tone="info">staked</Badge> : <span style={{ color: T.faint }}>—</span> },
    { key: 'tokenUri', header: 'tokenURI', render: (r) => r.tokenUri ? shortId(r.tokenUri, 22) : <span style={{ color: T.faint }}>пусто</span> },
  ];
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <Card>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input data-testid="sp-token-search" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') refetch(); }} placeholder="Поиск: tokenId / кошелёк / редкость" style={{ flex: 1, minWidth: 240, padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, outline: 'none' }} />
          <button onClick={() => refetch()} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: T.accent, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Найти</button>
        </div>
      </Card>
      <Card>
        <SectionTitle sub={`Token Explorer (live). Всего токенов: ${data?.total ?? 0}`}>Токены</SectionTitle>
        {loading ? <StateBlock kind="loading" /> : error ? <StateBlock kind="error" message={error} onRetry={refetch} /> : (
          <SimpleTable columns={columns} rows={data?.tokens || []} empty="Токены не найдены" testId="sp-tokens-table" />
        )}
      </Card>
    </div>
  );
};

const RevealSub: React.FC = () => {
  const { data, loading, error, refetch } = useAsync(() => api.getReveal(), []);
  if (loading) return <Card><StateBlock kind="loading" /></Card>;
  if (error) return <Card><StateBlock kind="error" message={error} onRetry={refetch} /></Card>;
  const dist = data?.distribution || {};
  const columns: Column<any>[] = [
    { key: 'walletAddress', header: 'Кошелёк', render: (r) => <Addr addr={r.walletAddress} /> },
    { key: 'tokenId', header: 'Token ID', render: (r) => `#${r.tokenId}` },
    { key: 'rarityName', header: 'Редкость', render: (r) => r.rarityName || '—' },
    { key: 'txHash', header: 'Tx', render: (r) => <Addr addr={r.txHash} kind="tx" /> },
    { key: 'openedAt', header: 'Дата', render: (r) => fmtDate(r.openedAt) },
  ];
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card style={{ borderLeft: `3px solid ${T.accent}` }}>
        <SectionTitle sub={data?.note}>Модель Reveal: {data?.model}</SectionTitle>
        <div style={{ fontSize: 13, color: T.sub }}>openPreMint(tokenId) не создаёт новый токен и не сжигает Box — меняет редкость того же tokenId (in-place). Отдельного события reveal в ABI нет.</div>
      </Card>
      <KpiGrid>
        <KpiCard label="Reveal rate" value={`${data?.revealRate ?? 0}%`} tone="good" />
        <KpiCard label="Revealed" value={data?.revealed ?? 0} />
        <KpiCard label="PreMint (не раскрыт)" value={data?.preMint ?? 0} />
        <KpiCard label="Всего токенов" value={data?.total ?? 0} />
      </KpiGrid>
      <Card>
        <SectionTitle>Распределение редкостей (live)</SectionTitle>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.keys(dist).length === 0 ? <StateBlock kind="empty" /> : Object.entries(dist).map(([k, v]) => (<Badge key={k} tone="info">{k}: {v as number}</Badge>))}
        </div>
      </Card>
      <Card>
        <SectionTitle sub="Записи openings (backend)">Открытия</SectionTitle>
        <SimpleTable columns={columns} rows={data?.openings || []} empty="Открытий пока нет" testId="sp-reveal-table" />
      </Card>
    </div>
  );
};

const TransfersSub: React.FC = () => {
  const { data, loading, error, refetch } = useAsync(() => api.getTransfers(), []);
  if (loading) return <Card><StateBlock kind="loading" /></Card>;
  if (error) return <Card><StateBlock kind="error" message={error} onRetry={refetch} /></Card>;
  const columns: Column<any>[] = [
    { key: 'tokenId', header: 'Token ID', render: (r) => `#${r.tokenId}` },
    { key: 'kind', header: 'Тип', render: (r) => <Badge tone={r.kind === 'mint' ? 'good' : r.kind === 'burn' ? 'bad' : 'default'}>{r.kind}</Badge> },
    { key: 'from', header: 'От', render: (r) => <Addr addr={r.from} explorer={data?.explorerBase} /> },
    { key: 'to', header: 'Кому', render: (r) => <Addr addr={r.to} explorer={data?.explorerBase} /> },
    { key: 'blockNumber', header: 'Блок', align: 'right' },
    { key: 'txHash', header: 'Tx', render: (r) => <Addr addr={r.txHash} explorer={data?.explorerBase} kind="tx" /> },
  ];
  return (
    <Card>
      <SectionTitle sub={`Индексированные Transfer события (всего: ${data?.total ?? 0}). Если пусто — запустите синхронизацию во вкладке Диагностика или задайте SPACEPORT_INDEX_FROM_BLOCK.`}>Передачи</SectionTitle>
      <SimpleTable columns={columns} rows={data?.transfers || []} empty="Передачи не индексированы" testId="sp-transfers-table" />
    </Card>
  );
};

const FusionSub: React.FC = () => {
  const { data, loading, error, refetch } = useAsync(() => api.getFusion(), []);
  if (loading) return <Card><StateBlock kind="loading" /></Card>;
  if (error) return <Card><StateBlock kind="error" message={error} onRetry={refetch} /></Card>;
  const rs = data?.raritySupply || {};
  const elig = data?.eligibility || {};
  const ops = data?.operations || {};
  const holderCols: Column<any>[] = [
    { key: 'wallet', header: 'Кошелёк', render: (r) => <Addr addr={r.wallet} /> },
    { key: 'possibleFusions', header: 'Возможных fusion', align: 'right', render: (r) => <Badge tone="good">{r.possibleFusions}</Badge> },
    { key: 'holdings', header: 'Холдинги', render: (r) => Object.entries(r.holdings || {}).map(([k, v]) => `${k}:${v}`).join(', ') },
  ];
  const opCols: Column<any>[] = [
    { key: 'kind', header: 'Тип', render: (r) => <Badge tone="info">{r.kind}</Badge> },
    { key: 'wallet', header: 'Кошелёк', render: (r) => <Addr addr={r.wallet} /> },
    { key: 'burned', header: 'Сожжено (in)', render: (r) => (r.burned || []).map((x: number) => `#${x}`).join(' + ') },
    { key: 'outputTokenId', header: 'Результат (out)', render: (r) => `#${r.outputTokenId}${r.outputRarityName ? ` [${r.outputRarityName}]` : ''}` },
    { key: 'txHash', header: 'Tx', render: (r) => <Addr addr={r.txHash} kind="tx" /> },
  ];
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <KpiGrid>
        <KpiCard label="Eligible holders" value={elig.eligibleHolders ?? 0} tone="good" />
        <KpiCard label="Возможных fusion" value={elig.totalPossibleFusions ?? 0} />
        <KpiCard label="Операций (indexed)" value={ops.indexedTotal ?? 0} hint={`Пользователей: ${ops.users ?? 0}`} />
        <KpiCard label="Shards / merge" value={data?.shardsNeeded ?? '—'} />
        <KpiCard label="Merge start time" value={data?.mergeStartTime === 0 ? 'открыт' : (data?.mergeStartTime ?? '—')} />
      </KpiGrid>
      <Card style={{ borderLeft: `3px solid ${T.accent}` }}>
        <SectionTitle sub="Fusion permissionless в контракте (owner-контроль только setMergeStartTime). Рецепты выведены из ABI; фактический output фиксируется per-операция в событии newRarity.">Рецепты Fusion</SectionTitle>
        <div style={{ display: 'grid', gap: 8 }}>
          {(data?.recipes || []).map((r: any) => (
            <div key={r.method} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.soft}`, fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 700, color: T.ink }}>{r.inputs} → {r.output}</div>
                <div style={{ fontSize: 12, color: T.faint, fontFamily: 'Source Code Pro, monospace' }}>{r.method} · {r.event}</div>
              </div>
              <Badge tone="default">permissionless</Badge>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <SectionTitle sub="Живое распределение редкостей (circulating).">Rarity supply</SectionTitle>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(rs.distribution || {}).map(([k, v]) => <Badge key={k} tone="info">{k}: {v as number}</Badge>)}
          <Badge tone="default">circulating: {rs.circulating ?? 0}</Badge>
        </div>
      </Card>
      <Card>
        <SectionTitle sub="Кто реально может сделать Fusion — из текущего on-chain владения, не из покупок.">Eligible holders</SectionTitle>
        <SimpleTable columns={holderCols} rows={elig.holders || []} empty="Нет держателей с достаточным набором для Fusion" testId="sp-fusion-eligible" />
      </Card>
      <Card>
        <SectionTitle sub={ops.historyStatus === 'INDEXED' ? 'Индексированные Fusion-операции.' : 'История Fusion недоступна в текущем окне логов RPC (или операций не было). Eligibility выше — живая.'}>Fusion операции</SectionTitle>
        <SimpleTable columns={opCols} rows={ops.items || []} empty="Fusion операций нет / UNAVAILABLE" testId="sp-fusion-ops" />
      </Card>
    </div>
  );
};

const ControlSub: React.FC = () => {
  const wallet = useWallet();
  const { data, loading, error, refetch } = useAsync(() => api.getContractControl(), []);
  const [busy, setBusy] = useState<string>('');
  const [priceInput, setPriceInput] = useState<string>('');

  const BSC_TESTNET = {
    chainIdHex: '0x61',
    addParam: {
      chainId: '0x61', chainName: 'BSC Testnet',
      nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
      rpcUrls: ['https://data-seed-prebsc-1-s1.bnbchain.org:8545'],
      blockExplorerUrls: ['https://testnet.bscscan.com'],
    },
  };

  const sale = data?.sale || {};
  const nft = data?.nft || {};
  const net = data?.network || {};
  const owner = (sale.owner || '').toLowerCase();
  const connected = (wallet.address || '').toLowerCase();
  const isOwner = !!connected && !!owner && connected === owner;

  const runWrite = async (action: string, params: any, label: string, highRisk = false) => {
    try {
      if (!wallet.isConnected) {
        await wallet.connect({ chainIdHex: BSC_TESTNET.chainIdHex, addParam: BSC_TESTNET.addParam });
      }
      const addr = (wallet.address || '').toLowerCase();
      if (!addr || addr !== owner) {
        toast.error(`Подключён ${shortId(addr, 12)} — это не owner (${shortId(owner, 12)}). Действие запрещено.`);
        return;
      }
      const confirmMsg = `${label}\n\nКонтракт: ${net.name} (chainId ${net.chainId})\nВы подпишете транзакцию owner-кошельком. Продолжить?`;
      if (highRisk && !window.confirm(`⚠ ВЫСОКИЙ РИСК\n${confirmMsg}`)) return;
      if (!window.confirm(confirmMsg)) return;

      setBusy(action);
      // 1) backend prepares + validates (owner-gate + encoded calldata)
      const prep = await api.prepareControl({ action, params, actorWallet: addr });
      if (!prep?.connectedWalletIsOwner) { toast.error('Backend: подключённый кошелёк не owner.'); setBusy(''); return; }
      // 2) ensure chain + send owner-signed tx (NO optimistic success)
      await wallet.ensureChain(BSC_TESTNET.chainIdHex, BSC_TESTNET.addParam);
      const signer = wallet.getSigner();
      const tx = await signer.sendTransaction({ to: prep.to, data: prep.data });
      toast.info(`Транзакция отправлена: ${shortId(tx.hash, 14)} — ждём подтверждения…`);
      await api.recordControl({ action, params, txHash: tx.hash, actorWallet: addr, status: 'submitted' });
      // 3) wait for receipt
      const receipt = await tx.wait();
      if (!receipt || receipt.status !== 1) { toast.error('Транзакция не удалась (receipt status != 1).'); setBusy(''); return; }
      // 4) re-read chain + audit
      await api.recordControl({ action, params, txHash: tx.hash, actorWallet: addr, status: 'confirmed' });
      toast.success('Подтверждено on-chain. Обновляю состояние из блокчейна…');
      refetch();
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || 'Ошибка транзакции');
    } finally {
      setBusy('');
    }
  };

  if (loading) return <Card><StateBlock kind="loading" /></Card>;
  if (error) return <Card><StateBlock kind="error" message={error} onRetry={refetch} /></Card>;

  const btn = (bg: string) => ({ padding: '9px 16px', borderRadius: 10, border: 'none', background: bg, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 } as React.CSSProperties);
  const capRow = (w: any) => (
    <div key={w.method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${T.soft}` }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{w.label}</div>
        <div style={{ fontSize: 11.5, color: T.faint, fontFamily: 'Source Code Pro, monospace' }}>{w.method}</div>
      </div>
      <Badge tone="warn">owner-signed</Badge>
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{net.name} · chainId {net.chainId}</div>
            <div style={{ fontSize: 12.5, color: T.sub, marginTop: 4 }}>Owner: {shortId(owner, 16)}. Backend не хранит ключи и не подписывает — подпись только owner-кошельком.</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <LiveDot ok={!!data?.rpc?.ok} label={data?.rpc?.ok ? `RPC LIVE · блок ${data?.rpc?.latestBlock}` : 'RPC недоступен'} />
            {wallet.isConnected
              ? <Badge tone={isOwner ? 'good' : 'bad'}>{isOwner ? `owner подключён ${shortId(connected, 10)}` : `не owner ${shortId(connected, 10)}`}</Badge>
              : <button data-testid="sp-connect-owner" style={btn(T.accent)} onClick={() => wallet.connect({ chainIdHex: BSC_TESTNET.chainIdHex, addParam: BSC_TESTNET.addParam }).catch(() => {})}>Подключить owner-кошелёк</button>}
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 16 }}>
        <Card testId="sp-control-sale">
          <SectionTitle sub={`Owner: ${shortId(sale.owner || '', 14)}`}>Sale — управление (owner-signed)</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10, fontSize: 13, marginBottom: 14 }}>
            <div><div style={{ color: T.sub, fontSize: 12 }}>Статус</div><Badge tone={sale.salePaused ? 'warn' : 'good'}>{sale.salePaused ? 'PAUSED' : 'ACTIVE'}</Badge></div>
            <div><div style={{ color: T.sub, fontSize: 12 }}>Цена</div>{sale.price ?? '—'}</div>
            <div><div style={{ color: T.sub, fontSize: 12 }}>Макс/кошелёк</div>{sale.maxPerWallet ?? '—'}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            {sale.salePaused
              ? <button data-testid="sp-btn-unpause" disabled={!isOwner || !!busy} style={btn(isOwner && !busy ? T.good : T.faint)} onClick={() => runWrite('setSalePaused', { paused: false }, 'Возобновить продажу (unpause)')}>{busy === 'setSalePaused' ? '…' : 'Возобновить продажу'}</button>
              : <button data-testid="sp-btn-pause" disabled={!isOwner || !!busy} style={btn(isOwner && !busy ? T.warn : T.faint)} onClick={() => runWrite('setSalePaused', { paused: true }, 'Приостановить продажу (pause)')}>{busy === 'setSalePaused' ? '…' : 'Приостановить продажу'}</button>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input data-testid="sp-price-input" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} placeholder={`Новая цена (${data?.paymentToken?.symbol || 'USDT'})`} style={{ flex: 1, minWidth: 160, padding: '9px 12px', borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 13 }} />
            <button data-testid="sp-btn-setprice" disabled={!isOwner || !!busy || !priceInput} style={btn(isOwner && !busy && priceInput ? T.accent : T.faint)} onClick={() => runWrite('setPrice', { price: priceInput }, `Установить цену = ${priceInput}`)}>{busy === 'setPrice' ? '…' : 'Изменить цену'}</button>
          </div>
          <div style={{ marginTop: 14 }}>{(sale.writeCapabilities || []).map(capRow)}</div>
        </Card>

        <Card testId="sp-control-nft">
          <SectionTitle sub={`Owner: ${shortId(nft.owner || '', 14)} · mergeStartTime: ${nft.mergeStartTime === 0 ? 'открыт' : (nft.mergeStartTime ?? '—')}`}>NFT / Fusion — управление</SectionTitle>
          <div style={{ fontSize: 13, marginBottom: 12 }}>
            <div style={{ color: T.sub, fontSize: 12 }}>baseURI</div>{nft.baseURI ? shortId(nft.baseURI, 30) : <span style={{ color: T.faint }}>пусто (metadata off-chain)</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button data-testid="sp-btn-merge-now" disabled={!isOwner || !!busy} style={btn(isOwner && !busy ? T.accent : T.faint)} onClick={() => runWrite('setMergeStartTime', { ts: Math.floor(Date.now() / 1000) }, 'Открыть Fusion сейчас (setMergeStartTime=now)')}>{busy === 'setMergeStartTime' ? '…' : 'Открыть Fusion сейчас'}</button>
          </div>
          {(nft.writeCapabilities || []).map(capRow)}
          <div style={{ marginTop: 10, fontSize: 12, color: T.faint }}>Высокорисковые (setPaymentToken/setNFTContract/rescue) — только как проверенные capability; исполнять по требованию с усиленным подтверждением.</div>
        </Card>
      </div>

      <Card style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
        <div style={{ fontSize: 12.5, color: T.warn, fontWeight: 700 }}>Контракт всегда вызываем напрямую on-chain. CRM показывает только ABI-подтверждённые методы. Никакого optimistic SUCCESS — статус меняется лишь после receipt + повторного чтения цепочки.</div>
      </Card>
    </div>
  );
};

const DiagnosticsSub: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const { data, loading, error, refetch } = useAsync(() => api.getDiagnostics(), []);
  const runSync = async () => {
    setSyncing(true);
    try {
      const r = await api.syncIndexer(false);
      toast.success(`Синхронизация: +${r?.inserted ?? 0} событий (блоки ${r?.scannedFrom}–${r?.scannedTo})`);
      refetch();
    } catch (e: any) {
      toast.error(e?.message || 'Ошибка синхронизации');
    } finally {
      setSyncing(false);
    }
  };
  if (loading) return <Card><StateBlock kind="loading" /></Card>;
  if (error) return <Card><StateBlock kind="error" message={error} onRetry={refetch} /></Card>;
  const counts = data?.counts || {};
  const health = data?.systemHealth || {};
  const toneFor = (s: string) => s === 'IN_SYNC' || s === 'HEALTHY' ? 'good' : s === 'INDEXER_BEHIND' || s === 'DEGRADED' ? 'warn' : s === 'MISMATCH' || s === 'ACTION_REQUIRED' || s === 'READS_UNAVAILABLE' ? 'bad' : 'default';
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <SectionTitle sub={`Сеть ${data?.network?.name} · chainId ${data?.network?.chainId} · источник ${data?.registrySource}`}>Reconciliation & Health</SectionTitle>
          <button data-testid="sp-sync-btn" onClick={runSync} disabled={syncing} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: syncing ? T.faint : T.accent, color: '#fff', fontWeight: 700, cursor: syncing ? 'default' : 'pointer' }}>{syncing ? 'Синхронизация…' : 'Синхронизировать индексер'}</button>
        </div>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
        {Object.entries(health).map(([k, v]) => (
          <Card key={k} style={{ padding: 14 }}>
            <div style={{ fontSize: 12, color: T.sub, textTransform: 'uppercase' }}>{k}</div>
            <div style={{ marginTop: 8 }}><Badge tone={toneFor(v as string) as any}>{v as string}</Badge></div>
          </Card>
        ))}
      </div>
      <Card>
        <SectionTitle>Проверки</SectionTitle>
        <div style={{ display: 'grid', gap: 8 }}>
          {(data?.checks || []).map((c: any) => (
            <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.soft}` }}>
              <div style={{ fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: T.ink }}>{c.key}</div>
                <div style={{ fontSize: 12, color: T.sub }}>{c.detail}</div>
              </div>
              <Badge tone={toneFor(c.status) as any}>{c.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
      <KpiGrid>
        <KpiCard label="Chain supply" value={counts.chainSupply ?? '—'} />
        <KpiCard label="Enumerated" value={counts.enumerated ?? '—'} />
        <KpiCard label="Chain minted" value={counts.chainMinted ?? '—'} />
        <KpiCard label="Indexed transfers" value={counts.indexedTransfers ?? 0} />
        <KpiCard label="Indexed purchased" value={counts.indexedPurchased ?? 0} />
        <KpiCard label="Backend purchases" value={counts.backendPurchases ?? 0} />
        <KpiCard label="Backend openings" value={counts.backendOpenings ?? 0} />
      </KpiGrid>
      {data?.accessReconciliation && (
        <Card>
          <SectionTitle sub={data.accessReconciliation.note}>Access ↔ Ownership reconciliation</SectionTitle>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <Badge tone="default">Активных: {data.accessReconciliation.totalActive}</Badge>
            {Object.entries(data.accessReconciliation.summary || {}).map(([k, v]) => (
              <Badge key={k} tone={k === 'IN_SYNC' ? 'good' : k === 'TRANSFER_PENDING' ? 'warn' : (k === 'OWNER_MISMATCH' || k === 'TOKEN_NOT_FOUND') ? 'bad' : 'default'}>{k}: {v as number}</Badge>
            ))}
            <Badge tone="info">policy: {data.accessReconciliation.policy}</Badge>
          </div>
          <SimpleTable
            columns={[
              { key: 'tokenId', header: 'Token', render: (r: any) => `#${r.tokenId}` },
              { key: 'currentOnChainOwner', header: 'On-chain owner', render: (r: any) => <Addr addr={r.currentOnChainOwner} /> },
              { key: 'benefitHolder', header: 'Benefit holder', render: (r: any) => <Addr addr={r.benefitHolder} /> },
              { key: 'expiresAt', header: 'Истекает', render: (r: any) => fmtDate(r.expiresAt) },
              { key: 'status', header: 'Статус', render: (r: any) => <Badge tone={r.status === 'IN_SYNC' ? 'good' : r.status === 'TRANSFER_PENDING' ? 'warn' : (r.status === 'OWNER_MISMATCH' || r.status === 'TOKEN_NOT_FOUND') ? 'bad' : 'default'}>{r.status}</Badge> },
            ] as Column<any>[]}
            rows={data.accessReconciliation.activations || []}
            empty="Активных NFT-access активаций нет"
            testId="sp-access-recon-table"
          />
        </Card>
      )}
      {Array.isArray(data?.needsAttention) && data.needsAttention.length > 0 && (
        <Card style={{ borderLeft: `3px solid ${T.warn}` }}>
          <SectionTitle>Needs Attention</SectionTitle>
          <ul style={{ margin: 0, paddingLeft: 18, color: T.sub, fontSize: 13, lineHeight: 1.7 }}>
            {data.needsAttention.map((n: string, i: number) => <li key={i}>{n}</li>)}
          </ul>
        </Card>
      )}
    </div>
  );
};

/**
 * NFT Assets Control Center — lives INSIDE «Доступ и монетизация → NFT Access».
 * Extends the existing NFT Access engine: asset lifecycle (supply/holders/tokens/
 * reveal/transfers/contract control/diagnostics) + the existing access-benefit
 * layer embedded under «Access Benefits».
 */
export const SpaceportControlCenter: React.FC = () => {
  const [sub, setSub] = useState('overview');
  return (
    <div data-testid="spaceport-control-center" style={{ display: 'grid', gap: 16 }}>
      <div role="tablist" style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: `1px solid ${T.border}` }}>
        {SUBTABS.map((t) => {
          const active = sub === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              data-testid={`nft-assets-subtab-${t.key}`}
              onClick={() => setSub(t.key)}
              style={{
                position: 'relative',
                padding: '11px 18px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                border: 'none',
                background: 'transparent',
                color: active ? T.accent : T.sub,
                borderBottom: `2px solid ${active ? T.accent : 'transparent'}`,
                marginBottom: -1,
                whiteSpace: 'nowrap',
                transition: 'color 150ms ease',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div>
        {sub === 'overview' && <OverviewSub />}
        {sub === 'collections' && <CollectionsSub />}
        {sub === 'sales' && <SalesSub />}
        {sub === 'holders' && <HoldersSub />}
        {sub === 'tokens' && <TokensSub />}
        {sub === 'reveal' && <RevealSub />}
        {sub === 'fusion' && <FusionSub />}
        {sub === 'transfers' && <TransfersSub />}
        {sub === 'benefits' && <NftAccessCenter />}
        {sub === 'control' && <ControlSub />}
        {sub === 'diagnostics' && <DiagnosticsSub />}
      </div>
    </div>
  );
};
