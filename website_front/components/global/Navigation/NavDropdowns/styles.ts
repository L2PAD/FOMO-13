import styled, { keyframes } from "styled-components";

const intelPulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(4, 165, 132, 0.0); }
  30%  { box-shadow: 0 0 0 4px rgba(4, 165, 132, 0.18); }
  70%  { box-shadow: 0 0 14px 3px rgba(4, 165, 132, 0.28); }
  100% { box-shadow: 0 0 0 0 rgba(4, 165, 132, 0.0); }
`;

const intelFade = keyframes`
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export const Wrapper = styled.div`
    display: flex;
    gap: 10px;
    align-items: center;

    
    @media (max-width: 768px) {
      margin-left: 40px;

      & .dropdown-line{
        display: none;
      }
    }

`

export const Dropdown = styled.div<{ isActive?: boolean }>`
    position: relative;
    width: 178px;

    @media (max-width: 1220px) {
        width: 122px;
    }

    
  & .update-indicator{
    position: absolute;
    top:18px;
    left:-1px;
    width:8px;
    height:8px;
    background: var(--main-red);
    border-radius: 50%;
    
    @media (max-width: 768px) {
      left: unset;
      right: 5px;
    }
  }
`


export const DropdownButton = styled.button<{ isOpen?: boolean }>`
  padding: 14px;
  width: 100%;
  background: ${({ isOpen }) => (isOpen ? "#E9F8F8" : "transparent")};
  border-radius: 8px;
  color: ${({ isOpen }) => (isOpen ? "var(--color-primary)" : "var(--main-gray)")};
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 1;

  display: flex;
  align-items: center;
  justify-content: space-between;

  transition: color 0.25s ease, background 0.25s ease, border-radius 0.25s ease, padding 0.25s ease;

  path {
    transition: stroke 0.25s ease, transform 0.25s ease;
    stroke: ${({ isOpen }) => (isOpen ? "var(--color-primary)" : undefined)};
  }

  &:hover {
    background: ${({ isOpen }) => (isOpen ? "#EAFBF7" : "#F9F9F9")};
    color: ${({ isOpen }) => (isOpen ? "var(--color-primary)" : "var(--main-black)")};

    path {
      stroke: ${({ isOpen }) => (isOpen ? "var(--color-primary)" : "var(--main-black)")};
    }
  }

  &:active {
    opacity: 0.7;
  }

  &.active{
    color: var(--main-black);

    path {
      stroke: var(--main-black);
    }
  }

  &.active:is(:hover, :focus-visible) {
    color: ${({ isOpen }) => (isOpen ? "var(--color-primary)" : "var(--main-black)")};
  }

  &.active:is(:hover, :focus-visible) path {
    stroke: ${({ isOpen }) => (isOpen ? "var(--color-primary)" : "var(--main-black)")};
  }

  ${({ isOpen }) =>
    isOpen &&
    `
      &.active {
        color: var(--color-primary);
      }

      &.active path {
        stroke: var(--color-primary);
      }
    `}

  @media (max-width: 768px) {
      padding: ${({ isOpen }) => (isOpen ? "18px 20px" : "10px 14px")};
  }

`;

export const DropdownContent = styled.div<{ isVisible: boolean }>`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 100%;

  background: var(--color-white);
  border-radius: 8px;
  padding: 16px;
  box-shadow:2px 2px 8px 0px #00053014;

  transform-origin: top;
  transform: ${({ isVisible }) =>
    isVisible
      ? 'translateY(0) scale(1)'
      : 'translateY(-6px) scale(0.98)'};

  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  pointer-events: ${({ isVisible }) => (isVisible ? 'auto' : 'none')};
  visibility: ${({ isVisible }) => (isVisible ? 'visible' : 'hidden')};

  transition:
    opacity 0.25s ease,
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    visibility ${({ isVisible }) => (isVisible ? '0s' : '0s 0.25s')};

  z-index: ${({ isVisible }) => (isVisible ? 100 : -1)};
`;

export const NavItem = styled.div<{ disabled?: boolean; delay?: number }>`
  position: relative;
  opacity: 0;
  transform: translateY(-5px);
  pointer-events: none;

  transition: 
    opacity 0.1s ease,
    transform 0.1s ease;

  ${({ delay }) =>
    delay &&
    `
    transition-delay: ${delay}s;
  `}

  &.visible {
    opacity: ${({ disabled }) => (disabled ? 0.45 : 1)};
    transform: translateY(0);
    pointer-events: auto;
  }

  
  #active-nav-link{
    font-weight: var(--font-weight-semibold);
    color: var(--main-black);
  }
`;


export const NavLink = styled.a<{ disabled?: boolean }>`
  padding:10px 0px;
  border-radius: 8px;


  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: ${({ disabled }) =>
    disabled ? 'var(--main-gray)' : 'var(--color-text-muted)'};
    cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};

  display: flex;
  align-items: center;
  justify-content: space-between;

  transition: background 0.2s ease, color 0.2s ease, opacity 0.2s ease;

  &:hover {
    opacity: 0.7;
  }

  &:active {
    opacity: 0.5;
  }

  ${({ disabled }) =>
    !disabled &&
    `
  `}

  &.has-children{
    position: relative;
  }
  .has-children svg {
  transform: rotate(-90deg);
}

  ${NavItem}:first-child & {
    padding-top: 0;
  }

  ${NavItem}:last-child & {
    padding-bottom: 0;
  }


`;

export const SubNav = styled.div<{ isVisible?: boolean }>`
  position: absolute;
  top: 5px;
  left: calc(100% + 20px);

  min-width: 180px;
  background: var(--color-white);
  border-radius: 8px;

  box-shadow: 2px 2px 8px 0px #00053014;

  padding: 12px 10px;

  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  transform: ${({ isVisible }) =>
    isVisible
      ? 'translateX(0) scale(1)'
      : 'translateX(-6px) scale(0.96)'};

  pointer-events: ${({ isVisible }) => (isVisible ? 'auto' : 'none')};
  z-index: ${({ isVisible }) => (isVisible ? 300 : -1)};
  transition:
    opacity 0.2s ease,
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);

`;

export const RotatingDropdownIconWrapper = styled.span<{ isOpen?: boolean }>`
  display: inline-block;
  transition: transform 0.25s ease;
  transform: rotate(${({ isOpen }) => (isOpen ? '-180deg' : '0deg')});

  &.sub-icon {
      transform: rotate(${({ isOpen }) => (isOpen ? '-180deg' : '-90deg')});
  }
`


/* ── FOMO Intel — the single external link to FOMO Intel Pro (platform green accent) ── */
export const IntelLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 13px;
  margin-left: 4px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: var(--font-weight-semibold);
  color: #037A63;
  background: linear-gradient(180deg, rgba(4, 165, 132, 0.10), rgba(4, 165, 132, 0.05));
  border: 1px solid rgba(4, 165, 132, 0.25);
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;

  .intel-spark {
    display: inline-flex;
    color: #04A584;
    transition: transform 0.25s ease;
  }
  .intel-pro {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.5px;
    color: #037A63;
    background: rgba(4, 165, 132, 0.14);
    border: 1px solid rgba(4, 165, 132, 0.30);
    padding: 2px 6px;
    border-radius: 999px;
    line-height: 1;
  }
  .intel-ext {
    color: rgba(4, 165, 132, 0.6);
    display: inline-flex;
    transition: transform 0.2s ease;
  }

  &:hover {
    background: linear-gradient(180deg, rgba(4, 165, 132, 0.18), rgba(4, 165, 132, 0.09));
    border-color: rgba(4, 165, 132, 0.45);
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(4, 165, 132, 0.20);
  }
  &:hover .intel-spark { transform: rotate(-12deg) scale(1.08); }
  &:hover .intel-ext { transform: translate(1px, -1px); }
  &:focus-visible { outline: 2px solid rgba(4, 165, 132, 0.55); outline-offset: 2px; }

  &.pulse { animation: ${intelPulse} 2.2s ease-in-out 2; }

  @media (max-width: 900px) {
    padding: 8px 11px;
    font-size: 14px;
  }
`

/* Wrapper to anchor the hover preview card under the Intel button */
export const IntelWrap = styled.div`
  position: relative;
  display: inline-flex;
`

/* Compact, light, premium teaser shown on hover — hints at deeper analytics before leaving the site */
export const IntelPreview = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 268px;
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(180deg, #FFFFFF 0%, #F4FBF9 100%);
  border: 1px solid rgba(4, 165, 132, 0.28);
  box-shadow: 0 18px 44px rgba(4, 62, 50, 0.16);
  z-index: 1200;
  animation: ${intelFade} 0.16s ease-out;
  cursor: default;

  &::before {
    content: "";
    position: absolute;
    top: -6px;
    right: 26px;
    width: 12px;
    height: 12px;
    background: #FFFFFF;
    border-left: 1px solid rgba(4, 165, 132, 0.28);
    border-top: 1px solid rgba(4, 165, 132, 0.28);
    transform: rotate(45deg);
  }

  .ip-head {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #0B1B17;
    font-size: 14px;
    font-weight: 800;
  }
  .ip-head .ip-pro {
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 0.5px;
    color: #037A63;
    background: rgba(4, 165, 132, 0.14);
    border: 1px solid rgba(4, 165, 132, 0.32);
    padding: 2px 6px;
    border-radius: 999px;
    line-height: 1;
  }
  .ip-sub {
    font-size: 11.5px;
    color: #64748B;
    margin-top: 6px;
    line-height: 16px;
  }
  .ip-list {
    display: grid;
    gap: 7px;
    margin-top: 12px;
  }
  .ip-item {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 12.5px;
    color: #334155;
    font-weight: 600;
  }
  .ip-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: linear-gradient(135deg, #04A584, #35C9A9);
    flex: none;
  }
  .ip-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 13px;
    padding-top: 11px;
    border-top: 1px solid rgba(4, 165, 132, 0.14);
    font-size: 11.5px;
    font-weight: 700;
    color: #037A63;
  }
  .ip-foot .ip-ext { display: inline-flex; color: rgba(4, 165, 132, 0.75); }
`


