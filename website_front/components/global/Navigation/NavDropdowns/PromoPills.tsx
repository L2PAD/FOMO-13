import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import styled, { keyframes } from 'styled-components'
import { LayoutContext } from '../../Layout'
import BotAvatar from '../../FomoAiWidget/BotAvatar'

/**
 * Two admin-managed promo pills in the site header:
 *   • FOMO AI    — GREEN, system bot avatar, internal target (membership / AI purchase)
 *   • FOMO Intel — BLACK, chart icon, external FOMO Intel Pro site
 * Height + rounding match the neighbouring AD banner for a cohesive header set.
 * Hover reveals a rich feature popover. Admin (CRM → Реклама → «Баннер рекламы»)
 * controls which pill(s) show and the rotation interval.
 */

interface PillCfg { enabled: boolean; label: string; subtitle: string; url: string }
interface Promo { mode: 'both' | 'ai' | 'intel'; rotateSeconds: number; ai: PillCfg; intel: PillCfg }

const DEFAULT_PROMO: Promo = {
  mode: 'both',
  rotateSeconds: 10,
  ai: { enabled: true, label: 'FOMO AI', subtitle: 'Your crypto research copilot', url: '/utility/ai' },
  intel: { enabled: true, label: 'FOMO Intel', subtitle: 'Pro-grade market intelligence', url: 'https://i.fomo.cx/' },
}

const AI_FEATURES = ['Ask FOMO anything', 'Deep project & fund research', 'EarlyLand early-activity intel']
const INTEL_FEATURES = ['Smart-money & whale flow', 'On-chain signals & alerts', 'M-Brain market prediction']

const fade = keyframes`from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); }`
const popIn = keyframes`from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); }`

const Wrap = styled.div` position: relative; display: inline-flex; `

const Pill = styled.a<{ $tone: 'green' | 'black' }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 15px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  animation: ${fade} 0.28s ease;
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
  background: ${({ $tone }) => ($tone === 'green' ? '#E7F7F1' : 'linear-gradient(135deg, #0B1220 0%, #141d3a 100%)')};
  color: ${({ $tone }) => ($tone === 'green' ? '#04A584' : '#FFFFFF')};
  border: 1px solid ${({ $tone }) => ($tone === 'green' ? '#B8E9DA' : 'rgba(255,255,255,0.10)')};

  .p-ico { display: inline-flex; align-items: center; }
  &:hover { transform: translateY(-1px); box-shadow: 0 8px 20px ${({ $tone }) => ($tone === 'green' ? 'rgba(4,165,132,0.20)' : 'rgba(11,18,32,0.32)')}; }
  &:active { filter: brightness(0.97); }
  .ext { opacity: 0.7; }
  &:hover .ext { transform: translate(1px, -1px); }
`

const Pop = styled.div<{ $tone: 'green' | 'black' }>`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 3000;
  width: 288px;
  padding: 15px 16px;
  border-radius: 14px;
  animation: ${popIn} 0.18s ease;
  background: ${({ $tone }) => ($tone === 'green' ? '#FFFFFF' : 'radial-gradient(130% 130% at 22% 14%, #1b1c21 0%, #101014 55%, #050506 100%)')};
  color: ${({ $tone }) => ($tone === 'green' ? '#0B1220' : '#FFFFFF')};
  border: 1px solid ${({ $tone }) => ($tone === 'green' ? '#E5E8EE' : 'rgba(255,255,255,0.10)')};
  box-shadow: 0 20px 48px rgba(7,11,53,0.24);

  .pp-head { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 800; margin-bottom: 6px; }
  .pp-tag { font-size: 9px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; padding: 3px 7px; border-radius: 999px;
    background: ${({ $tone }) => ($tone === 'green' ? '#E7F7F1' : 'rgba(255,255,255,0.14)')};
    color: ${({ $tone }) => ($tone === 'green' ? '#04A584' : '#fff')}; }
  .pp-sub { font-size: 12.5px; line-height: 1.45; margin-bottom: 10px;
    color: ${({ $tone }) => ($tone === 'green' ? '#5B6472' : 'rgba(255,255,255,0.72)')}; }
  .pp-item { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; padding: 4px 0; }
  .pp-dot { width: 6px; height: 6px; border-radius: 999px; flex-shrink: 0; background: ${({ $tone }) => ($tone === 'green' ? '#04A584' : '#2EE6B7')}; }
  .pp-foot { display: flex; align-items: center; gap: 6px; margin-top: 11px; padding-top: 11px; font-size: 12px; font-weight: 700;
    border-top: 1px solid ${({ $tone }) => ($tone === 'green' ? '#EEF1F5' : 'rgba(255,255,255,0.10)')};
    color: ${({ $tone }) => ($tone === 'green' ? '#04A584' : '#fff')}; }
`

const ChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3v18h18" /><path d="M7 14l3.5-3.5 2.5 2.5 5-5" /></svg>
)
const ExtIcon = () => (
  <svg className="ext" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17L17 7" /><path d="M8 7h9v9" /></svg>
)

const isExternal = (url: string) => /^https?:\/\//i.test(url || '')

const PromoPills: React.FC = () => {
  const router = useRouter()
  const { layout } = useContext(LayoutContext) as any
  const [hover, setHover] = useState<'ai' | 'intel' | null>(null)
  const closeT = useRef<any>(null)

  const promo: Promo = useMemo(() => {
    const p = layout?.promo
    if (!p) return DEFAULT_PROMO
    return { ...DEFAULT_PROMO, ...p, ai: { ...DEFAULT_PROMO.ai, ...p.ai }, intel: { ...DEFAULT_PROMO.intel, ...p.intel } }
  }, [layout])

  const pills = useMemo(() => {
    const arr: Array<'ai' | 'intel'> = []
    if ((promo.mode === 'both' || promo.mode === 'ai') && promo.ai.enabled) arr.push('ai')
    if ((promo.mode === 'both' || promo.mode === 'intel') && promo.intel.enabled) arr.push('intel')
    return arr
  }, [promo])

  const rotating = promo.mode === 'both' && pills.length > 1
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (!rotating || hover) return
    const ms = Math.max(5, promo.rotateSeconds || 10) * 1000
    const t = setInterval(() => setIdx((i) => (i + 1) % pills.length), ms)
    return () => clearInterval(t)
  }, [rotating, promo.rotateSeconds, pills.length, hover])

  if (pills.length === 0) return null

  const open = (w: 'ai' | 'intel') => { if (closeT.current) clearTimeout(closeT.current); setHover(w) }
  const close = () => { closeT.current = setTimeout(() => setHover(null), 130) }

  const renderPill = (which: 'ai' | 'intel') => {
    const cfg = which === 'ai' ? promo.ai : promo.intel
    const tone: 'green' | 'black' = which === 'ai' ? 'green' : 'black'
    const external = which === 'intel' || isExternal(cfg.url)
    const label = cfg.label || (which === 'ai' ? 'FOMO AI' : 'FOMO Intel')
    const features = which === 'ai' ? AI_FEATURES : INTEL_FEATURES
    const onClick = (e: React.MouseEvent) => { if (!external) { e.preventDefault(); router.push(cfg.url || '/utility/ai') } }
    return (
      <Wrap key={which} onMouseEnter={() => open(which)} onMouseLeave={close}>
        <Pill
          $tone={tone}
          href={cfg.url || (which === 'ai' ? '/utility/ai' : '/')}
          onClick={onClick}
          target={external ? '_blank' : undefined}
          rel={external ? 'noreferrer noopener' : undefined}
          title={cfg.subtitle || label}
          aria-label={`${label} — ${cfg.subtitle || ''}`}
          data-testid={`promo-pill-${which}`}
        >
          <span className="p-ico">{which === 'ai' ? <BotAvatar size={20} color="#04A584" /> : <ChartIcon />}</span>
          <span>{label}</span>
          {external ? <ExtIcon /> : null}
        </Pill>
        {hover === which ? (
          <Pop $tone={tone} data-testid={`promo-pop-${which}`} onMouseEnter={() => open(which)} onMouseLeave={close}>
            <div className="pp-head">
              {label}
              <span className="pp-tag">{which === 'ai' ? 'On-site' : 'External · Pro'}</span>
            </div>
            <div className="pp-sub">{cfg.subtitle || (which === 'ai' ? 'Your crypto research copilot' : 'Go deeper than the public app.')}</div>
            {features.map((f) => <div key={f} className="pp-item"><span className="pp-dot" />{f}</div>)}
            <div className="pp-foot">
              {which === 'ai' ? 'Open FOMO AI' : 'Opens FOMO Intel Pro'}
              {external ? <ExtIcon /> : null}
            </div>
          </Pop>
        ) : null}
      </Wrap>
    )
  }

  const key = rotating ? pills[idx % pills.length] : pills[0]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }} data-testid="promo-pills">
      {rotating ? renderPill(key) : pills.map(renderPill)}
    </div>
  )
}

export default PromoPills
