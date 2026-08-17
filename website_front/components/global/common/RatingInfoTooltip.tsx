import React, { useState } from "react";
import styled, { keyframes } from "styled-components";

/**
 * RatingInfoTooltip — an (i) info affordance next to a FOMO rating that, on
 * hover/focus, reveals a production-style popover explaining, in plain English,
 * how the rating is calculated. Keeps the score system transparent for users.
 * One popover covers People / Projects / Funds / Users so it can sit anywhere a
 * FOMO rating is shown.
 */

const fadeIn = keyframes`from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); }`;

const Wrap = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
  line-height: 0;
`;

const InfoBtn = styled.button`
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 1.5px solid #C7CED9;
  background: transparent;
  color: #8A94A6;
  font-size: 11px;
  font-weight: 800;
  font-family: Georgia, "Times New Roman", serif;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: help;
  padding: 0;
  transition: color 0.15s ease, border-color 0.15s ease;
  &:hover, &:focus-visible { color: #04A584; border-color: #04A584; outline: none; }
`;

const Pop = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 4000;
  width: 320px;
  max-width: 88vw;
  padding: 16px 18px;
  border-radius: 16px;
  background: #FFFFFF;
  border: 1px solid #EDF0F4;
  box-shadow: 0 24px 60px rgba(9, 20, 44, 0.16);
  text-align: left;
  animation: ${fadeIn} 0.16s ease;
  cursor: default;

  &::before {
    content: "";
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 12px;
    height: 12px;
    background: #FFFFFF;
    border-left: 1px solid #EDF0F4;
    border-top: 1px solid #EDF0F4;
  }

  .ri-title { font-size: 15px; font-weight: 800; color: #0B1220; margin-bottom: 6px; letter-spacing: -0.01em; }
  .ri-lead { font-size: 12.5px; line-height: 1.55; color: #5B6472; margin-bottom: 10px; }
  .ri-item { display: flex; gap: 8px; font-size: 12px; line-height: 1.5; color: #45505F; padding: 3px 0; }
  .ri-item b { color: #0B1220; font-weight: 700; }
  .ri-dot { width: 6px; height: 6px; border-radius: 999px; background: #04A584; flex-shrink: 0; margin-top: 6px; }
  .ri-foot { margin-top: 10px; padding-top: 10px; border-top: 1px solid #F0F2F6; font-size: 11.5px; color: #8A94A6; }
`;

const RatingInfoTooltip: React.FC<{ className?: string }> = ({ className }) => {
  const [open, setOpen] = useState(false);
  return (
    <Wrap
      className={className}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      data-testid="rating-info-tooltip"
    >
      <InfoBtn
        type="button"
        aria-label="How the FOMO rating is calculated"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        i
      </InfoBtn>
      {open && (
        <Pop role="tooltip" data-testid="rating-info-popover">
          <div className="ri-title">How the FOMO rating works</div>
          <div className="ri-lead">
            A 0–100 influence score that blends on-chain footprint, social reach &amp; engagement,
            market activity and network centrality — normalized against peers and time-decayed so
            recent signals weigh more.
          </div>
          <div className="ri-item"><span className="ri-dot" /><span><b>People</b> — personal reach, engagement quality and who they&apos;re connected to.</span></div>
          <div className="ri-item"><span className="ri-dot" /><span><b>Projects</b> — community traction, on-chain activity and backer strength.</span></div>
          <div className="ri-item"><span className="ri-dot" /><span><b>Funds</b> — portfolio performance, deal flow and network influence.</span></div>
          <div className="ri-item"><span className="ri-dot" /><span><b>Users</b> — FOMO activity, contributions and on-platform reputation.</span></div>
          <div className="ri-foot">Higher means stronger, verified influence.</div>
        </Pop>
      )}
    </Wrap>
  );
};

export default RatingInfoTooltip;
