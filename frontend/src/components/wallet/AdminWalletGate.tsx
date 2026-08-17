import React, { useState } from 'react';
import { useWallet } from './WalletProvider';
import { getAdminWallet, decodeAdminJwt } from '../utils/adminJwt';
import logout from '../services/auth/logout';

/*
 * PRODUCTION admin gate.
 * A logged-in operator is NOT considered an admin until they connect the wallet
 * that is linked to their account (from the admin JWT). No wallet / wrong wallet
 * => no CRM. This is the single, platform-wide access control for on-chain admin.
 */

const short = (a: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—');

// zkSync Era — the network the acquiring/custody contract lives on.
const ZKSYNC = {
  chainIdHex: '0x144',
  addParam: {
    chainId: '0x144',
    chainName: 'zkSync Era Mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.era.zksync.io'],
    blockExplorerUrls: ['https://explorer.zksync.io/'],
  },
};

const WalletIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#04A584" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
    <path d="M21 7H7a2 2 0 0 0 0 4h14v-4Z" />
    <circle cx="16" cy="12" r="1.2" fill="#04A584" stroke="none" />
  </svg>
);

export const AdminWalletGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, chainId, isConnected, connecting, connect, disconnect } = useWallet();
  const [error, setError] = useState('');
  const adminWallet = getAdminWallet();
  const jwt = decodeAdminJwt();

  const matches = !!address && !!adminWallet && address.toLowerCase() === adminWallet.toLowerCase();

  // DEV/PREVIEW bypass: on the Emergent preview the seeded admin has no linked
  // wallet, so the on-chain gate would block the whole CRM. This flag lets the
  // operator (and automated tests) reach the CRM during development.
  // It is OFF by default and MUST NOT be set in production.
  const bypass = process.env.REACT_APP_WALLET_GATE_BYPASS === "true";

  // Access granted only when the connected wallet is the admin's linked wallet.
  if (matches || bypass) return <>{children}</>;

  const doConnect = async () => {
    setError('');
    try {
      const conn = await connect({ chainIdHex: ZKSYNC.chainIdHex, addParam: ZKSYNC.addParam });
      if (adminWallet && conn.address.toLowerCase() !== adminWallet.toLowerCase()) {
        setError(`Подключён ${short(conn.address)} — это не админский кошелёк. Переключитесь в кошельке на ${short(adminWallet)} и повторите.`);
      }
    } catch (e: any) {
      setError(e?.message || 'Не удалось подключить кошелёк');
    }
  };

  const doLogout = () => { logout(); window.location.reload(); };

  const S = {
    overlay: { position: 'fixed' as const, inset: 0, background: 'linear-gradient(160deg, #F6FAF9 0%, #EEF4F3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 },
    card: { width: '100%', maxWidth: 460, background: '#fff', borderRadius: 20, border: '1px solid #E5EAE8', boxShadow: '0 24px 60px rgba(7,11,53,0.10)', padding: 32 },
    iconWrap: { width: 60, height: 60, borderRadius: 16, background: 'var(--color-primary-soft, rgba(4,165,132,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
    h1: { fontSize: 21, fontWeight: 800, color: 'var(--color-text-primary, #070B35)', margin: 0, letterSpacing: -0.2 },
    sub: { fontSize: 13.5, color: 'var(--color-text-secondary, #53627C)', marginTop: 8, lineHeight: 1.6 },
    row: { background: '#F8FAFA', border: '1px solid #EAEFED', borderRadius: 12, padding: '12px 14px', marginTop: 16 },
    label: { fontSize: 10.5, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: 'var(--color-text-muted, #738094)', fontWeight: 700 },
    mono: { fontFamily: 'monospace', fontSize: 13, color: 'var(--color-text-primary, #070B35)', marginTop: 3, wordBreak: 'break-all' as const },
    btn: { width: '100%', background: 'var(--color-primary, #04A584)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 16px', fontSize: 15, fontWeight: 700, cursor: connecting ? 'wait' as const : 'pointer' as const, marginTop: 20 },
    err: { background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, marginTop: 14, lineHeight: 1.5 },
    logout: { display: 'block', width: '100%', textAlign: 'center' as const, background: 'transparent', border: 'none', color: 'var(--color-text-muted, #738094)', fontSize: 12.5, marginTop: 14, cursor: 'pointer', textDecoration: 'underline' },
    wrongDot: { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#DC2626', marginRight: 6 },
  };

  return (
    <div style={S.overlay} data-testid="admin-wallet-gate">
      <div style={S.card}>
        <div style={S.iconWrap}><WalletIcon /></div>
        <h1 style={S.h1}>Подтвердите доступ администратора</h1>
        <p style={S.sub}>
          Вход в CRM разрешён только с подключённым кошельком, привязанным к вашему аккаунту. Управление эквайрингом и все on-chain действия подписываются этим кошельком — приватный ключ нигде не хранится.
        </p>

        <div style={S.row}>
          <div style={S.label}>Требуемый админский кошелёк</div>
          <div style={S.mono} data-testid="gate-required-wallet">{adminWallet || 'не привязан к аккаунту'}</div>
          {jwt?.email ? <div style={{ fontSize: 11.5, color: 'var(--color-text-muted, #738094)', marginTop: 6 }}>Аккаунт: {jwt.email}</div> : null}
        </div>

        {isConnected ? (
          <div style={S.row}>
            <div style={S.label}>Подключённый кошелёк</div>
            <div style={S.mono} data-testid="gate-connected-wallet">
              {!matches ? <span style={S.wrongDot} /> : null}{address}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--color-text-muted, #738094)', marginTop: 6 }}>Сеть: {chainId === 324 ? 'zkSync Era' : (chainId ? `chainId ${chainId}` : '—')}</div>
          </div>
        ) : null}

        {error ? <div style={S.err} data-testid="gate-error">{error}</div> : null}

        <button style={S.btn} onClick={doConnect} disabled={connecting} data-testid="gate-connect-btn">
          {connecting ? 'Подключение…' : isConnected ? 'Переключить / повторить подключение' : 'Подключить кошелёк'}
        </button>

        <button style={S.logout} onClick={doLogout} data-testid="gate-logout-btn">Выйти из аккаунта</button>
      </div>
    </div>
  );
};

export default AdminWalletGate;
