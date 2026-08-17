import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled, { keyframes } from 'styled-components'
import { LayoutContext } from '../Layout'
import { ILayoutBanner } from '../../../http/layout/fetchLayoutData'
import Placeholder from '../common/Placeholder'
import serveAd, { ServedAd } from '../../../http/ads/serveAd'
import trackAd, { AdEventType } from '../../../http/ads/trackAd'
import AdvertiseCTA from '../AdvertiseModal'

const getSid = (): string => {
  if (typeof window === 'undefined') return ''
  try {
    let s = localStorage.getItem('fomo_ad_sid')
    if (!s) { s = 'sid-' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('fomo_ad_sid', s) }
    return s
  } catch { return 'anon' }
}

const Anchor = styled.div`
    position: relative;
    width: 100%;
    min-width: 0;
`;

const Wrapper = styled.a`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    background: linear-gradient(135deg, #0B1220 0%, #0f1730 55%, #141d3a 100%);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 6.5px 12px;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 20px;
    color: #FFFFFF;
    user-select: none;
    justify-content: center;
    overflow: hidden;
    cursor: pointer;
    transition: box-shadow 0.25s ease, transform 0.2s ease, opacity 0.25s ease, border-color 0.25s ease;

    &:hover{ box-shadow: 0 8px 22px rgba(7,11,53,0.45); transform: translateY(-1px); border-color: rgba(255,255,255,0.18); }
    &:active{ opacity: 0.9; }

    & .add-text{
        flex: 0 0 auto;
        padding: 2px 7px;
        border-radius: 6px;
        background: #FFFFFF26;
        font-size: 11px;
        letter-spacing: 0.4px;
        text-transform: uppercase;
    }
    & .description-text{
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: left;
    }
    & .chev{ flex: 0 0 auto; opacity: 0.8; transition: transform 0.2s ease; }
    &:hover .chev{ transform: translateY(1px); }
`;

const popIn = keyframes`
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Pop = styled.div<{ $dark: boolean }>`
    z-index: 4000;
    border-radius: 14px;
    overflow: hidden;
    background: ${({ $dark }) => ($dark ? '#0B1220' : '#FFFFFF')};
    color: ${({ $dark }) => ($dark ? '#FFFFFF' : '#0B1220')};
    border: 1px solid ${({ $dark }) => ($dark ? 'rgba(255,255,255,0.08)' : '#E5E8EE')};
    box-shadow: 0 20px 48px rgba(7,11,53,0.28);
    animation: ${popIn} 0.2s ease;

    .pop-cover{ width: 100%; display: block; aspect-ratio: 16 / 7; object-fit: cover; }
    .pop-body{ padding: 14px; }
    .pop-top{ display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .pop-tag{
        font-size: 9px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;
        padding: 3px 7px; border-radius: 6px;
        background: ${({ $dark }) => ($dark ? 'rgba(255,255,255,0.16)' : '#EEF2FF')};
        color: ${({ $dark }) => ($dark ? '#fff' : '#4F46E5')};
    }
    .pop-brand{ font-size: 12px; font-weight: 800; opacity: 0.85; }
    .pop-headline{ font-size: 16px; line-height: 21px; font-weight: 800; }
    .pop-desc{
        font-size: 12.5px; line-height: 17px; margin-top: 6px;
        color: ${({ $dark }) => ($dark ? 'rgba(255,255,255,0.72)' : '#5B6472')};
        display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
    }
    .pop-cta{
        display: block; margin-top: 12px; padding: 10px 14px; border-radius: 10px; text-align: center;
        font-weight: 800; font-size: 13px;
        background: ${({ $dark }) => ($dark ? '#fff' : '#4F46E5')};
        color: ${({ $dark }) => ($dark ? '#0B1220' : '#fff')};
    }
`;

const GlobalAd = () => {
  const layoutData = useContext(LayoutContext)
  const banner: ILayoutBanner | undefined = layoutData?.layout?.banner
  const [served, setServed] = useState<ServedAd | null>(null)
  const [open, setOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const firedRef = useRef<Record<string, boolean>>({})
  const ctxRef = useRef<{ device: string; session: string } | null>(null)
  const closeTimer = useRef<any>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ left: number; top: number; width: number }>({ left: 0, top: 0, width: 320 })

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return
    const r = anchorRef.current.getBoundingClientRect()
    const width = Math.max(300, r.width)
    let left = r.left
    if (typeof window !== 'undefined' && left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - 12 - width)
    }
    setCoords({ left, top: r.bottom + 8, width })
  }, [open])

  useEffect(() => {
    const device = typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop'
    ctxRef.current = { device, session: getSid() }
    serveAd('GLOBAL_TOP_BANNER', { device, loggedIn: false, session: ctxRef.current.session }).then(setServed)
  }, [])

  const fire = (type: AdEventType) => {
    if (!served?.filled || !served.deliveryId) return
    if (type !== 'click' && type !== 'cta_click' && type !== 'expand' && firedRef.current[type]) return
    if (type !== 'click' && type !== 'cta_click') firedRef.current[type] = true
    const ctx = ctxRef.current!
    trackAd({ deliveryId: served.deliveryId, campaignId: served.campaignId, creativeId: served.creativeId, placement: 'GLOBAL_TOP_BANNER', type, sessionId: ctx.session, device: ctx.device, viewablePct: type === 'viewable_impression' ? 100 : undefined, dwellMs: type === 'viewable_impression' ? 1000 : undefined })
  }

  useEffect(() => {
    if (!served?.filled) return
    fire('loaded'); fire('impression')
    const t = setTimeout(() => fire('viewable_impression'), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [served])

  useEffect(() => {
    if (served?.mode !== 'rotate' || !served?.filled) { setShowForm(false); return }
    const adMs = Math.max(3, served.rotateAdSeconds || 30) * 1000
    const formMs = Math.max(3, served.rotateFormSeconds || 10) * 1000
    let cancelled = false
    let t: any
    const cycle = (form: boolean) => {
      if (cancelled) return
      setShowForm(form)
      t = setTimeout(() => cycle(!form), form ? formMs : adMs)
    }
    cycle(false)
    return () => { cancelled = true; clearTimeout(t) }
  }, [served])

  const openPop = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    if (!open) {
      setOpen(true)
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('fomo-ad-popover', { detail: { open: true } }))
      if (!firedRef.current['expand']) { firedRef.current['expand'] = true; fire('expand' as AdEventType) }
    }
  }
  const closePop = () => {
    closeTimer.current = setTimeout(() => {
      setOpen(false)
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('fomo-ad-popover', { detail: { open: false } }))
    }, 120)
  }

  if (layoutData?.isLoading) {
    return <Placeholder width="100%" height="33px" borderRadius="8px" marginBottom="0" />
  }

  // Admin set this slot to always show the request form (ads suppressed here)
  if (served && served.mode === 'form') {
    return <AdvertiseCTA compact source="global-top" />
  }
  // Rotate mode: currently in the "form" phase of the ad ↔ form rotation
  if (served && served.mode === 'rotate' && showForm) {
    return <AdvertiseCTA compact source="global-top" />
  }

  // 1) A paid campaign for the top banner wins — compact pill + rich hover-expand popover
  if (served?.filled && served.creative) {
    const c = served.creative
    const variant = c.variant || 'gradient'
    const dark = variant === 'dark' || variant === 'gradient'
    const goToAd = () => { fire('cta_click'); fire('click'); if (c.destinationUrl && typeof window !== 'undefined') window.open(c.destinationUrl, '_blank', 'noopener') }
    return (
      <Anchor ref={anchorRef} onMouseEnter={openPop} onMouseLeave={closePop}>
        <Wrapper as="div" onClick={goToAd} aria-haspopup="true" aria-expanded={open} data-testid="global-ad-pill">
          <div className='add-text'>{c.sponsoredLabel || 'Ad'}</div>
          <div className='description-text'>{c.headline}</div>
          <svg className="chev" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5.5L7 9.5L11 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Wrapper>
        {open && typeof document !== 'undefined' ? createPortal(
          <Pop $dark={dark} data-testid="global-ad-popover" onMouseEnter={openPop} onMouseLeave={closePop} onClick={goToAd}
            style={{ position: 'fixed', left: coords.left, top: coords.top, width: coords.width, cursor: 'pointer' }}>
            {c.imageUrl ? <img className="pop-cover" src={c.imageUrl} alt={c.alt || ''} /> : null}
            <div className="pop-body">
              <div className="pop-top">
                {c.logoUrl ? <img src={c.logoUrl} alt="" style={{ width: 22, height: 22, borderRadius: 6, objectFit: 'cover' }} /> : null}
                <span className="pop-tag">{c.sponsoredLabel || 'Ad'}</span>
                {c.brandName ? <span className="pop-brand">{c.brandName}</span> : null}
              </div>
              <div className="pop-headline">{c.headline}</div>
              {c.description ? <div className="pop-desc">{c.description}</div> : null}
              <span className="pop-cta">{c.ctaLabel || 'Learn more'}</span>
            </div>
          </Pop>,
          document.body
        ) : null}
      </Anchor>
    )
  }

  // 2) Legacy layout banner (compatibility)
  if (banner?.isVisible && banner?.text?.trim()) {
    return (
      <Wrapper href={banner.link || undefined} target={banner.link ? '_blank' : undefined} rel={banner.link ? 'noreferrer' : undefined} data-testid="global-ad-legacy">
        <div className='add-text'>Ad</div>
        <div className='description-text'>{banner.text}</div>
      </Wrapper>
    )
  }

  // 3) No ad -> "Your ad here" plaque in the same spot (opens request modal)
  return <AdvertiseCTA compact source="global-top" />
}

export default GlobalAd
