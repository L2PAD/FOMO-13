import React from 'react';
import { T } from '../Statistics/ui';

export interface CreativeLike {
  brandName?: string; logoUrl?: string; imageUrl?: string; mobileImageUrl?: string;
  headline?: string; description?: string; ctaLabel?: string; sponsoredLabel?: string; variant?: string; alt?: string;
  template?: string; kindOverride?: string; progress?: number; progressLabel?: string;
  highlights?: { label: string; value: string; link?: string }[];
}

const SponsoredTag: React.FC<{ label?: string; dark?: boolean }> = ({ label, dark }) => (
  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', padding: '3px 7px', borderRadius: 6, background: dark ? 'rgba(255,255,255,0.16)' : '#EEF2FF', color: dark ? '#fff' : T.accent }}>{label || 'Ad'}</span>
);

/** Premium ad renderer used both in CRM preview and on the public site (same look). */
const AdPreview: React.FC<{ creative: CreativeLike; format?: 'compact' | 'expanded'; onCta?: () => void }> = ({ creative, format = 'expanded', onCta }) => {
  const variant = creative.variant || 'gradient';
  const dark = variant === 'dark' || variant === 'gradient';
  const bg = variant === 'dark' ? '#0B1220' : variant === 'light' ? '#FFFFFF' : 'linear-gradient(120deg,#0b1220 0%,#111a3a 55%,#3730A3 100%)';
  const textColor = dark ? '#fff' : T.ink;
  const subColor = dark ? 'rgba(255,255,255,0.72)' : T.sub;

  if (format === 'compact') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: bg, border: dark ? 'none' : `1px solid ${T.border}`, minHeight: 56 }}>
        {creative.logoUrl ? <img src={creative.logoUrl} alt="" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover' }} /> : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SponsoredTag label={creative.sponsoredLabel} dark={dark} />
            {creative.brandName ? <span style={{ fontSize: 11.5, color: subColor, fontWeight: 700 }}>{creative.brandName}</span> : null}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: textColor, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{creative.headline || 'Ad headline'}</div>
        </div>
        <button onClick={onCta} style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: dark ? '#fff' : T.accent, color: dark ? T.ink : '#fff', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', whiteSpace: 'nowrap' }}>{creative.ctaLabel || 'Learn more'}</button>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', background: bg, border: dark ? 'none' : `1px solid ${T.border}`, boxShadow: '0 12px 30px rgba(7,11,53,0.10)', maxWidth: 460 }}>
      {creative.imageUrl ? (
        <div style={{ position: 'relative' }}>
          <img src={creative.imageUrl} alt={creative.alt || ''} style={{ width: '100%', display: 'block', aspectRatio: '2 / 1', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', top: 10, left: 10 }}><SponsoredTag label={creative.sponsoredLabel} dark /></div>
        </div>
      ) : null}
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          {creative.logoUrl ? <img src={creative.logoUrl} alt="" style={{ width: 26, height: 26, borderRadius: 7, objectFit: 'cover' }} /> : null}
          {creative.brandName ? <span style={{ fontSize: 12.5, color: subColor, fontWeight: 800 }}>{creative.brandName}</span> : null}
          {!creative.imageUrl ? <div style={{ marginLeft: 'auto' }}><SponsoredTag label={creative.sponsoredLabel} dark={dark} /></div> : null}
        </div>
        <div style={{ fontSize: 19, lineHeight: '25px', fontWeight: 800, color: textColor }}>{creative.headline || 'Your premium ad headline'}</div>
        {creative.description ? <div style={{ fontSize: 13.5, lineHeight: '19px', color: subColor, marginTop: 8 }}>{creative.description}</div> : null}
        {(() => {
          const tpl = creative.template || 'facts';
          const prog = Math.max(0, Math.min(100, Number(creative.progress || 0)));
          const hls = (creative.highlights || []).filter((h) => h && h.label && h.value).slice(0, 6);
          const rows = tpl === 'deal' || tpl === 'offer' || tpl === 'profile';
          const showProg = prog > 0 && (tpl === 'deal' || tpl === 'offer');
          return (
            <>
              {showProg ? (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, marginBottom: 6, color: subColor }}>
                    <span>{creative.progressLabel || 'Прогресс'}</span><span style={{ color: dark ? '#B9C2FF' : T.accent }}>{prog}%</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.1)' : '#EEF2FF', overflow: 'hidden' }}>
                    <div style={{ width: `${prog}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#4F46E5,#6D5EF6)' }} />
                  </div>
                </div>
              ) : null}
              {hls.length ? (
                rows ? (
                  <div style={{ marginTop: 12, display: 'grid', gap: 1, borderRadius: 12, overflow: 'hidden', border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : T.border}` }}>
                    {hls.map((h, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 11px', background: dark ? 'rgba(255,255,255,0.04)' : '#F8FAFF' }}>
                        <span style={{ fontSize: 12, color: subColor }}>{h.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: h.link ? (dark ? '#B9C2FF' : T.accent) : textColor }}>{h.value}{h.link ? ' ↗' : ''}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {hls.map((h, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, padding: '5px 10px', borderRadius: 999, background: dark ? 'rgba(255,255,255,0.06)' : '#F1F4FA', border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : T.border}` }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3, color: subColor }}>{h.label}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: h.link ? (dark ? '#B9C2FF' : T.accent) : textColor }}>{h.value}{h.link ? ' ↗' : ''}</span>
                      </span>
                    ))}
                  </div>
                )
              ) : null}
            </>
          );
        })()}
        <button onClick={onCta} style={{ marginTop: 16, width: '100%', padding: '12px 16px', borderRadius: 11, border: dark ? '1px solid rgba(255,255,255,0.28)' : 'none', background: dark ? 'transparent' : T.accent, color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>{creative.ctaLabel || 'Learn more'}</button>
      </div>
    </div>
  );
};

export default AdPreview;
