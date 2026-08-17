import styled from "styled-components";
import Typography from "../common/Typography";
import { mainGlobalDark } from "../../../styles/mainGlobalDark";

export const FooterWrapper = styled.footer`
  padding: 42px 56px 18px;
  background: ${mainGlobalDark.background};

  @media (max-width: 1280px) {
    padding: 34px 28px 16px;
  }

  @media (max-width: 900px) {
    padding: 32px 20px 20px;
  }
`;

export const FooterContent = styled.div`
  max-width: 90vw;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 56px;

  @media (max-width: 900px) {
    max-width: 100%;
    grid-template-columns: minmax(0, 1fr);
    gap: 32px;
  }
`;

export const LeftWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  .footer-logo {
    width: 109px;
    height: 46px;
    object-fit: contain;
  }

  @media (max-width: 900px) {
    gap: 12px;

    .footer-logo {
      width: 94px;
      height: auto;
    }
  }
`;

export const ListsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 48px;

  .footer-nav-cols {
    display: flex;
    gap: clamp(40px, 5vw, 96px);
  }

  .footer-nav-cols > div {
    min-width: 120px;
  }

  @media (max-width: 1100px) {
    flex-direction: column;
    gap: 32px;
  }

  @media (max-width: 900px) {
    flex-direction: column;
    gap: 28px;

    .footer-nav-cols {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 28px 20px;
    }
  }
`;

export const ListTitle = styled(Typography)`
  margin: 0 0 14px !important;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 20px;
  color: var(--color-text-soft);
`;

export const ListItemsWrapper = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;

  &.social {
    display: grid;
    grid-template-columns: repeat(4, 36px);
    grid-auto-rows: 36px;
    gap: 10px;
  }

  li {
    display: flex;
    align-items: center;

    a,
    button {
      background: transparent;
      border: none;
      padding: 0;
      font-size: 14px;
      line-height: 22px;
      font-weight: var(--font-weight-regular);
      color: var(--color-text-muted);
      cursor: pointer;
      transition: color 0.2s ease, opacity 0.2s ease;
      text-align: left;
      white-space: nowrap;

      &:hover {
        color: var(--color-text-soft);
        opacity: 1;
      }
    }
  }

  &.social li {
    min-height: 36px;

    a {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;

      &:hover {
        border-color: var(--color-text-soft);
      }
    }
  }
`;

export const InboxTitle = styled.div`
  span {
    display: block;
    font-size: 14px;
    line-height: 20px;
    font-weight: var(--font-weight-regular);
    color: var(--color-text-soft);
  }
`;

export const FomoLabel = styled.div`
  white-space: nowrap;
  font-size: 14px;
  line-height: 20px;
  color: var(--color-text-soft);
`;

export const FooterBottom = styled.div`
  max-width: 90vw;
  margin: 28px auto 0;
  padding-top: 16px;
  border-top: 1px solid white;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;

  .disclaimer-text {
    max-width: 940px;
    font-size: 14px;
    line-height: 20px;
    color: var(--color-text-soft);
  }

  @media (max-width: 900px) {
    max-width: 100%;
    margin-top: 28px;
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;

    .disclaimer-text {
      max-width: 100%;
      font-size: 12px;
      line-height: 18px;
    }
  }
`;

/* ── FOMO Intel mobile app promo (compact, restrained green brand accent on the dark footer) ── */
export const AppPromo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 0;
  max-width: 300px;
`;

export const AppPromoHead = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  color: #fff;

  .app-spark {
    display: inline-flex;
    color: #00DD73;
  }

  .app-pro {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.5px;
    color: #04A584;
    background: rgba(4, 165, 132, 0.16);
    border: 1px solid rgba(4, 165, 132, 0.38);
    padding: 2px 6px;
    border-radius: 999px;
    line-height: 1;
  }
`;

export const AppPromoText = styled.p`
  margin: 0;
  max-width: 260px;
  font-size: 12px;
  line-height: 17px;
  color: var(--color-text-soft);
`;

export const StoreButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 2px;
`;

export const StoreButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 7px 13px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.14);
  text-decoration: none;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;

  .store-ico {
    display: inline-flex;
    color: #fff;
    flex: none;
  }

  .store-copy {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
  }

  .store-top {
    font-size: 8.5px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    color: var(--color-text-soft);
  }

  .store-name {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: #fff;
  }

  &:hover {
    background: rgba(4, 165, 132, 0.14);
    border-color: rgba(4, 165, 132, 0.45);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    opacity: 0.85;
  }

  &:focus-visible {
    outline: 2px solid rgba(4, 165, 132, 0.6);
    outline-offset: 2px;
  }
`;

export const TwoLinksWrapper = styled.div``;
export const LogoWrapper = styled.div``;
export const InboxWrapper = styled.div``;
export const InboxInputWrapper = styled.div``;
export const ModalText = styled.div``;
