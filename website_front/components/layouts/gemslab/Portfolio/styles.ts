import styled from "styled-components";
import Link from "next/link";
import ViewCard from "../../../global/ViewCard";
import PageHeader from "../../../global/PageHeader";
import { mainGlobalDark } from "../../../../styles/mainGlobalDark";

export const PageWrapper = styled.div`
  width: 1204px;
  margin: 0 auto;
  margin-top: 32px;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
`;

export const ContentWrapper = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 16px;

  @media (max-width: 1204px) {
    flex-direction: column-reverse;
  }
`;

export const ProjectsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

export const ProjectCardItem = styled(ViewCard)`
  height: 100% !important;
`;

export const ProjectCardLink = styled(Link)`
  width: 288px !important;

  & > div {
    width: 100% !important;
  }

  @media (max-width: 1204px) {
    width: 32% !important;
  }

  @media (max-width: 932px) {
    width: 48% !important;
  }

  @media (max-width: 631px) {
    width: 100% !important;
  }
`;

export const EditButton = styled.button`
  border: none;
  background: none;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-primary);
`;

export const PortfolioWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 40px 0;
  flex-wrap: wrap;
  gap: 16px;
  @media (max-width: 640px) {
    margin: 24px 0;
    gap: 12px;
    .contact-btn {
      width: 100%;
      order: 3;
    }
  }

  & .tab {
    width: auto !important;
    background: #f9f9f9;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  & .secondary {
    background: transparent;
  }

  &.core-portfolio-controls .contact-btn {
    @media (min-width: 768px) {
      display: none;
    }
  }
`;

export const CorePortfolioHeader = styled.header`
  min-height: 58px;
  margin-bottom: 16px;
  padding: 12px 14px 12px 16px;
  border: 1px solid #f0f2f5;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: rgba(0, 5, 48, 0.06) 2px 2px 8px;
  display: flex;
  align-items: center;
  gap: 18px;
  position: relative;
  z-index: 30;

  @media (max-width: 980px) {
    align-items: center;
    flex-wrap: wrap;
    gap: 12px 14px;
  }

  @media (max-width: 575px) {
    min-height: 0;
    margin-bottom: 12px;
    padding: 14px;
    border-radius: 12px;
  }
`;

export const CorePortfolioTitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;

  .tooltip-button {
    position: relative;
    z-index: 3;
    width: 16px;
    height: 16px;
    margin-top: 4px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
    cursor: help;
  }

  .tooltip-button .tooltip-text {
    left: 0;
    transform: translate(0, 50%);
    white-space: normal;
    text-align: left;
    max-width: min(360px, calc(100vw - 32px));
  }

  .tooltip-button:hover .tooltip-text {
    transform: translate(0, 5%);
  }

  .tooltip-button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 221, 115, 0.16);
  }

  .tooltip-button:focus-visible .tooltip-text {
    opacity: 1;
    visibility: visible;
    transform: translate(0, 5%);
  }

  h1 {
    margin: 0;
    color: var(--main-black);
    font-size: 26px;
    font-weight: var(--font-weight-semibold);
    line-height: 32px;
    letter-spacing: -0.025em;
  }
`;

export const CorePortfolioHeaderRight = styled.div`
  min-width: 0;
  max-width: 100%;
  flex: 0 1 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-left: auto;

  @media (max-width: 980px) {
    width: 100%;
    margin-left: 0;
    justify-content: flex-end;
  }

  @media (max-width: 720px) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 460px) {
    grid-template-columns: 1fr;
  }
`;

export const CorePortfolioSearchWrapper = styled.div`
  position: relative;
  width: 260px;
  flex: 0 1 260px;
  min-width: 180px;
  max-width: 260px;

  .inputRootWrapper,
  .inputRootWrapper > div,
  input {
    width: 100%;
  }

  input {
    height: 38px;
    border-radius: 8px;
    background: #f9f9f9;
    color: var(--main-black);
    font-size: 14px;
    font-weight: var(--font-weight-regular);
  }

  input::placeholder {
    color: var(--color-text-soft);
    font-size: 14px;
  }

  @media (max-width: 980px) {
    flex: 1 1 260px;
    max-width: 430px;
  }

  @media (max-width: 720px) {
    width: 100%;
    max-width: none;
    grid-column: 1 / -1;
  }
`;

export const CorePortfolioSearchDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 35;
  width: max(100%, 320px);
  max-width: min(420px, calc(100vw - 32px));
  max-height: 320px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid rgba(83, 98, 124, 0.07);
  border-radius: 10px;
  background: var(--color-white);
  box-shadow: 2px 2px 8px 0px #00053014;
  display: grid;
  gap: 6px;

  &::-webkit-scrollbar {
    width: 0;
  }

  @media (max-width: 767px) {
    width: min(420px, calc(100vw - 32px));
  }
`;

export const CorePortfolioSearchDropdownItem = styled.button`
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #f5fbfd;
  }

  &:hover strong {
    color: var(--main-green);
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px rgba(0, 165, 132, 0.35);
  }

  .logo {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${mainGlobalDark.background};
  }

  .logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .logo span {
    color: var(--color-white);
    font-size: 13px;
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
  }

  .content {
    flex: 1;
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  .top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--main-black);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 18px;
    transition: color 0.2s ease;
  }

  .share-code,
  .owner,
  p {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .share-code {
    flex: 0 0 auto;
    color: var(--main-gray);
    font-size: 11px;
    font-weight: var(--font-weight-semibold);
    line-height: 14px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .owner {
    color: var(--main-black);
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 16px;
  }

  .owner-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .owner-avatar {
    flex: 0 0 auto;
  }

  p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 12px;
    font-weight: var(--font-weight-regular);
    line-height: 16px;
  }
`;

export const CorePortfolioSearchDropdownState = styled.div`
  padding: 12px 10px;
  border-radius: 8px;
  display: grid;
  gap: 6px;

  strong {
    color: var(--main-black);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 18px;
  }

  span {
    color: var(--color-text-muted);
    font-size: 12px;
    font-weight: var(--font-weight-regular);
    line-height: 16px;
  }

  button {
    width: fit-content;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--main-green);
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 16px;
    cursor: pointer;
  }
`;

export const CorePortfolioDesktopButton = styled.div`
  position: relative;

  .active-portfolio-label {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .portfolio-header-btn {
    width: 100%;
    height: 38px;
    min-width: 120px;
    padding: 9px 14px;
    border-color: rgba(12, 26, 43, 0.16);
    border-radius: 8px;
    background: var(--color-white);
    color: ${mainGlobalDark.background};
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 18px;
    white-space: nowrap;
    transition:
      background 0.18s ease,
      border-color 0.18s ease,
      color 0.18s ease,
      box-shadow 0.18s ease;

    &:hover {
      border-color: rgba(12, 26, 43, 0.26);
      background: var(--color-surface-subtle);
      color: ${mainGlobalDark.background};
      box-shadow: none;
    }

    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px rgba(0, 221, 115, 0.16);
    }
  }

  .portfolio-header-btn.primary {
    min-width: 154px;
    border-color: ${mainGlobalDark.border};
    background: ${mainGlobalDark.background};
    color: ${mainGlobalDark.white};

    &:hover {
      border-color: ${mainGlobalDark.border};
      background: ${mainGlobalDark.backgroundHover};
      color: ${mainGlobalDark.white};
    }
  }
`;

export const CorePortfolioDropdownList = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 50%;
  transform: translateX(50%);
  z-index: 30;
  width: 292px;
  max-height: 320px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid ${mainGlobalDark.border};
  border-radius: 10px;
  background: ${mainGlobalDark.background};
  box-shadow: 0 12px 32px rgba(0, 5, 20, 0.32);

  &::-webkit-scrollbar {
    width: 0;
  }
`;

export const CorePortfolioDropdownItem = styled.button<{ active?: boolean }>`
  width: 100%;
  min-height: 56px;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: ${({ active }) =>
    active ? mainGlobalDark.backgroundHover : "transparent"};
  display: flex;
  align-items: flex-start;
  gap: 10px;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: ${mainGlobalDark.backgroundHover};
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px rgba(0, 221, 115, 0.48);
  }

  &:hover .portfolio-name {
    color: var(--main-green);
  }

  img {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
    flex: 0 0 auto;
    margin-top: 2px;
  }

  .portfolio-logo-fallback {
    width: 24px;
    height: 24px;
    flex: 0 0 24px;
    margin-top: 2px;
    border-radius: 50%;
    border: 1px solid ${mainGlobalDark.border};
    background: rgba(255, 255, 255, 0.08);
    color: ${mainGlobalDark.white};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: var(--font-weight-semibold);
    letter-spacing: 0.02em;
  }

  .portfolio-dropdown-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .portfolio-dropdown-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .portfolio-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${({ active }) =>
      active ? mainGlobalDark.positive : mainGlobalDark.white};
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 18px;
  }

  .portfolio-balance {
    flex: 0 0 auto;
    white-space: nowrap;
    color: ${mainGlobalDark.white};
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 16px;
  }

  .portfolio-dropdown-bottom {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .portfolio-description {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${mainGlobalDark.textMuted};
    font-size: 11px;
    font-weight: var(--font-weight-regular);
    line-height: 14px;
  }

  .portfolio-change {
    flex: 0 0 auto;
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 14px;
    white-space: nowrap;
    margin-left: auto;
  }

  .portfolio-change.green {
    color: ${mainGlobalDark.positive};
  }

  .portfolio-change.red {
    color: var(--color-danger);
  }

  .portfolio-change.neutral {
    color: ${mainGlobalDark.textMuted};
  }
`;

export const CorePortfolioDropdownEmpty = styled.div`
  padding: 10px 8px;
  color: ${mainGlobalDark.textMuted};
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
`;

export const CorePortfolioIntroWrapper = styled.div<{
  $isCorePortfolio: boolean;
}>`
  display: block;

  ${({ $isCorePortfolio }) =>
    $isCorePortfolio
      ? `
    @media (min-width: 768px) {
      display: none;
    }
  `
      : ""}
`;

export const PublicPortfolioSearchSection = styled.div`
  margin-top: 24px;
  padding: 24px;
  border: 1px solid rgba(83, 98, 124, 0.08);
  border-radius: 16px;
  background: var(--color-white);
  box-shadow: 2px 2px 8px 0px #00053014;
  display: grid;
  gap: 16px;

  .search-copy {
    display: grid;
    gap: 8px;
  }

  .eyebrow {
    color: var(--main-gray);
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 1;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h2 {
    margin: 0;
    color: var(--main-black);
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    line-height: 1.1;
  }

  p {
    margin: 0;
    color: #4d5b70;
    font-size: 14px;
    line-height: 20px;
  }

  @media (max-width: 767px) {
    margin-top: 16px;
    padding: 18px;

    h2 {
      font-size: 22px;
    }
  }
`;

export const PublicPortfolioSearchInputWrapper = styled.div`
  max-width: 420px;

  .inputRootWrapper,
  .inputRootWrapper > div,
  input {
    width: 100%;
  }

  input {
    height: 42px;
    border-radius: 10px;
    background: #f9f9f9;
    color: var(--main-black);
    font-size: 14px;
    font-weight: var(--font-weight-regular);
  }

  input::placeholder {
    color: var(--color-text-soft);
    font-size: 14px;
  }
`;

export const PublicPortfolioSearchState = styled.div`
  padding: 20px;
  border-radius: 14px;
  border: 1px dashed rgba(83, 98, 124, 0.18);
  background: var(--color-surface-subtle);
  display: grid;
  gap: 10px;
  justify-items: flex-start;

  h3 {
    margin: 0;
    color: var(--main-black);
    font-size: 18px;
    font-weight: var(--font-weight-semibold);
    line-height: 1.2;
  }

  &.error {
    border-style: solid;
    background: #fff8f8;
  }
`;

export const PublicPortfolioSearchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const PublicPortfolioSearchCard = styled.div`
  padding: 18px;
  border: 1px solid rgba(83, 98, 124, 0.08);
  border-radius: 16px;
  background: var(--color-white);
  display: grid;
  gap: 14px;

  .card-top {
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }

  .identity {
    flex: 1;
    min-width: 0;
    display: flex;
    gap: 14px;
  }

  .logo {
    width: 56px;
    height: 56px;
    flex: 0 0 56px;
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(180deg, #0b162f 0%, #102549 100%);
  }

  .logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .logo span {
    color: var(--color-white);
    font-size: 20px;
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
  }

  .copy {
    flex: 1;
    min-width: 0;
    display: grid;
    gap: 8px;
  }

  .copy-top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
  }

  .copy h3 {
    margin: 0;
    color: var(--main-black);
    font-size: 20px;
    font-weight: var(--font-weight-semibold);
    line-height: 1.2;
  }

  .copy p {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }

  .share-code {
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 999px;
    background: #eef2f6;
    color: var(--main-gray);
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 1;
  }

  .meta {
    min-width: 160px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--color-surface-subtle);
    display: grid;
    gap: 4px;
  }

  .meta span,
  .stat span {
    color: var(--main-gray);
    font-size: 11px;
    font-weight: var(--font-weight-semibold);
    line-height: 1;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .meta strong,
  .stat strong {
    color: var(--main-black);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 18px;
  }

  .meta small {
    color: var(--color-text-muted);
    font-size: 12px;
    line-height: 16px;
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .stat {
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--color-surface-subtle);
    display: grid;
    gap: 6px;
  }

  .stat strong.green {
    color: var(--main-green);
  }

  .stat strong.red {
    color: var(--color-danger);
  }

  .stat strong.neutral {
    color: var(--main-gray);
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: var(--main-gray);
    font-size: 13px;
    font-weight: var(--font-weight-medium);
    line-height: 18px;
  }

  @media (max-width: 640px) {
    .card-top,
    .card-footer {
      flex-direction: column;
      align-items: flex-start;
    }

    .meta {
      min-width: 0;
      width: 100%;
    }

    .stats-row {
      grid-template-columns: 1fr;
    }
  }
`;

export const PublicPortfolioSearchAction = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 8px 14px;
  border-radius: 8px;
  background: var(--main-green);
  color: var(--color-white);
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
  text-decoration: none;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.92;
  }
`;

export const PortfolioBody = styled.div`
  width: 100%;
`;

export const LeftColumn = styled.div`
  width: 65%;
  @media (max-width: 1100px) {
    width: 100%;
  }
`;

export const RightColumn = styled.div`
  width: 35%;
  @media (max-width: 1100px) {
    width: 100%;
  }
`;

export const PortfolioHeaderBlock = styled(PageHeader)`
  margin-bottom: 40px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
  @media (max-width: 900px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const PortfolioHeaderLeft = styled.div`
  width: 50%;

  h4 {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 100%;
    margin-bottom: 20px;
    display: flex;
    gap: 8px;
    span {
      font-size: 18px;
      color: var(--main-green);
    }
  }

  p {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 20px;
  }
  @media (max-width: 1100px) {
    width: 70%;
  }
  @media (max-width: 900px) {
    width: 100%;
  }
  @media (max-width: 600px) {
    p {
      font-size: 14px;
      line-height: 18px;
    }
  }
`;

export const PortfolioHeaderRight = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;

  .portfolio-btn {
    height: 38px;
    min-width: 120px;
    padding: 9px 14px;
    border: 1px solid var(--color-primary);
    border-radius: 8px;
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    line-height: 18px;
    white-space: nowrap;

    svg,
    svg *,
    img {
      transition:
        fill 0.3s ease,
        stroke 0.3s ease,
        filter 0.3s ease;
    }

    &:hover {
      svg,
      svg * {
        fill: var(--color-white) !important;
        stroke: var(--color-white) !important;
      }

      img {
        filter: brightness(0) invert(1);
      }
    }
  }

  @media (max-width: 900px) {
    width: 100%;
    justify-content: flex-start;
  }
  @media (max-width: 600px) {
    gap: 12px;
    .portfolio-btn {
      flex: 1 1 auto;
    }
    .square-btn {
      height: 38px;
      width: 38px;
      min-width: 38px;
      padding: 9px;
    }
  }
`;

export const PrivatePortfolioHeaderLayout = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.9fr);
  gap: 20px;

  @media (max-width: 1120px) {
    grid-template-columns: 1fr;
  }
`;

export const PrivatePortfolioHero = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const PrivatePortfolioIdentity = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 18px;
  padding: 20px;
  border-radius: 18px;

  .content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .title-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  h4 {
    margin: 0;
    color: var(--main-black);
    font-size: 32px;
    font-weight: var(--font-weight-semibold);
    line-height: 1.05;
  }

  p {
    margin: 0;
    color: #4d5b70;
    font-size: 15px;
    line-height: 22px;
    max-width: 62ch;
  }

  @media (max-width: 600px) {
    flex-direction: column;
    padding: 16px;

    h4 {
      font-size: 28px;
    }
  }
`;

export const PrivatePortfolioLogo = styled.div`
  width: 88px;
  height: 88px;
  flex: 0 0 88px;
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  span {
    color: var(--color-white);
    font-size: 28px;
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
  }

  @media (max-width: 600px) {
    width: 72px;
    height: 72px;
    flex-basis: 72px;
    border-radius: 20px;
  }
`;

export const PrivatePortfolioBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const PrivatePortfolioBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: #eef2f6;
  color: var(--main-gray);
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  letter-spacing: 0.02em;

  &.success {
    background: #e8fbf4;
    color: #047857;
  }

  &.warning {
    background: #fff5d9;
    color: #8a6400;
  }

  &.muted {
    background: #eef2f6;
    color: var(--main-gray);
  }
`;

export const PrivatePortfolioOwnerCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 16px;

  .owner-top {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .owner-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .eyebrow {
    color: var(--main-gray);
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 1;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  h5 {
    margin: 0;
    color: var(--main-black);
    font-size: 20px;
    font-weight: var(--font-weight-semibold);
    line-height: 1.1;
  }

  .owner-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
  }

  .owner-pill {
    color: var(--main-gray);
    font-size: 13px;
    font-weight: var(--font-weight-medium);
    line-height: 18px;
  }

  .owner-pill-copy {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: color 0.2s ease;

    span {
      color: inherit;
    }

    svg {
      width: 14px;
      height: 14px;
      flex: 0 0 auto;
    }

    &:hover {
      color: var(--main-green);

      svg path {
        stroke: var(--main-green);
      }
    }
  }
`;

export const PrivatePortfolioMetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const PrivatePortfolioMetaItem = styled.div`
  min-width: 0;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(83, 98, 124, 0.08);
  background: var(--color-white);

  span {
    display: block;
    margin-bottom: 6px;
    color: var(--main-gray);
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 1.1;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  strong {
    display: block;
    color: var(--main-black);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 18px;
  }
`;

export const PrivatePortfolioCategories = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .category-chip {
    display: inline-flex;
    align-items: center;
    padding: 8px 10px;
    border-radius: 12px;
    background: var(--color-white);
    border: 1px solid rgba(83, 98, 124, 0.08);
    color: var(--main-gray);
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 1;
  }
`;

export const PrivatePortfolioStatsPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const PrivatePortfolioLeadStat = styled.div`
  padding: 20px;
  border-radius: 18px;
  background: linear-gradient(180deg, #0b162f 0%, #102549 100%);
  color: var(--color-white);
  box-shadow: 0 18px 40px rgba(16, 37, 73, 0.08);

  .label {
    color: rgba(255, 255, 255, 0.68);
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 1;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .value {
    margin-top: 10px;
    font-size: 34px;
    font-weight: var(--font-weight-semibold);
    line-height: 1.05;
  }

  .delta {
    margin-top: 10px;
    color: #c9d5e7;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 20px;
  }

  .delta.positive {
    color: #7ff0c0;
  }

  .delta.negative {
    color: #ff9b9b;
  }
`;

export const PrivatePortfolioPerformanceRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;

  .performance-item {
    min-width: 0;
    padding: 10px 12px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.07);
  }

  .performance-label {
    display: block;
    color: rgba(255, 255, 255, 0.62);
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 1;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .performance-value {
    display: block;
    margin-top: 8px;
    color: var(--color-white);
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    line-height: 1.1;
  }

  .performance-value.positive {
    color: #7ff0c0;
  }

  .performance-value.negative {
    color: #ff9b9b;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const PrivatePortfolioMetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const PrivatePortfolioMetricCard = styled.div`
  min-width: 0;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(83, 98, 124, 0.08);
  background: var(--color-white);

  .label {
    display: block;
    color: var(--main-gray);
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 1;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .value {
    display: block;
    margin-top: 8px;
    color: var(--main-black);
    font-size: 20px;
    font-weight: var(--font-weight-semibold);
    line-height: 1.15;
  }

  .value.positive {
    color: var(--main-green);
  }

  .value.negative {
    color: var(--color-danger);
  }

  .subtle {
    display: block;
    margin-top: 6px;
    color: var(--color-text-muted);
    font-size: 12px;
    font-weight: var(--font-weight-medium);
    line-height: 16px;
  }
`;

export const TopMovers = styled.div`
  margin-top: 40px;
  h2 {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 100%;
    margin-bottom: 20px;
  }

  & .movers-items {
    display: flex;
    align-items: start;
    gap: 20px;
    height: 100%;
    @media (max-width: 900px) {
      flex-direction: column;
      > div {
        width: 100%;
      }
    }
  }
`;

export const PortfolioActionsWrapper = styled.div`
  position: relative;
  height: 100%;

  & .actions-modal {
    width: 200px;
    position: absolute;
    top: 42px;
    right: -5px;
    z-index: 2;
  }
  @media (max-width: 600px) {
    .actions-modal {
      right: 0;
      left: auto;
      top: 48px;
      width: 180px;
    }
  }
`;
