import React, { useState } from 'react';
import { useWallet } from './WalletProvider';

/*
 * Global "Connect Wallet" control for the CRM sidebar footer.
 * Visible on every admin page — one connection shared across the whole panel.
 */

const short = (a: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '');

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  324: 'zkSync Era',
  56: 'BNB Chain',
  137: 'Polygon',
};

export const WalletButton: React.FC<{ collapsed?: boolean }> = ({ collapsed }) => {
  const { address, chainId, isConnected, connecting, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);

  const handle = async () => {
    if (isConnected) { setOpen((v) => !v); return; }
    try { await connect(); } catch (e: any) { alert(e?.message || 'Не удалось подключить кошелёк'); }
  };

  const dotColor = isConnected ? '#059669' : '#94A3B8';
  const chainLabel = chainId ? (CHAIN_NAMES[chainId] || `chainId ${chainId}`) : '';

  return (
    <div style={{ position: 'relative', marginBottom: 10 }} data-testid="global-wallet">
      {open && isConnected ? (
        <div
          style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, right: 0, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, boxShadow: '0 12px 30px rgba(15,23,42,0.12)', padding: 10, zIndex: 200 }}
          data-testid="global-wallet-menu"
        >
          <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Подключённый кошелёк</div>
          <div style={{ fontSize: 12.5, fontFamily: 'monospace', color: '#0F172A', wordBreak: 'break-all', marginBottom: 6 }}>{address}</div>
          <div style={{ fontSize: 11.5, color: '#475569', marginBottom: 10 }}>Сеть: {chainLabel || '—'}</div>
          <button
            style={{ width: '100%', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
            onClick={() => { disconnect(); setOpen(false); }}
            data-testid="global-wallet-disconnect"
          >
            Отключить
          </button>
        </div>
      ) : null}
      <button
        type="button"
        onClick={handle}
        disabled={connecting}
        data-testid="global-wallet-btn"
        title={isConnected ? `${address} · ${chainLabel}` : 'Подключить кошелёк'}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          background: isConnected ? '#F0FDF4' : '#EEF2FF',
          border: `1px solid ${isConnected ? '#BBF7D0' : '#C7D2FE'}`,
          borderRadius: 10, padding: collapsed ? '9px' : '9px 11px',
          cursor: connecting ? 'wait' : 'pointer', justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: dotColor, flex: '0 0 auto' }} />
        {!collapsed ? (
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.25, overflow: 'hidden' }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: isConnected ? '#047857' : '#4338CA' }}>
              {connecting ? 'Подключение…' : isConnected ? short(address) : 'Подключить кошелёк'}
            </span>
            {isConnected ? <span style={{ fontSize: 10.5, color: '#64748B' }}>{chainLabel}</span> : <span style={{ fontSize: 10.5, color: '#818CF8' }}>для on-chain действий</span>}
          </span>
        ) : null}
      </button>
    </div>
  );
};

export default WalletButton;
