import styled, { keyframes } from "styled-components";
import Typography from "../../../../global/common/Typography";
import BaseCard from "../../../../global/common/BaseCard";
import {
  BaseCardCryptoWrapper,
  BaseCardWrapper,
} from "../../../../global/common/BaseCard/styles";
import { mainGlobalDark } from "../../../../../styles/mainGlobalDark";

const marketHeaderPriceLoadingPulse = keyframes`
  0%,
  100% {
    opacity: 0.42;
  }

  50% {
    opacity: 0.68;
  }
`;

export const PageWrapper = styled.div`
  width: 1204px;
  margin: 32px auto 0;

  ${BaseCardWrapper},
  ${BaseCardCryptoWrapper} {
    background: rgb(255, 255, 255);
    border: 1px solid var(--Stroke, #f0f2f5);
    box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
    border-radius: 12px;
  }

  ${BaseCardWrapper}:hover,
  ${BaseCardCryptoWrapper}:hover {
    background: rgb(255, 255, 255);
    border-color: var(--Stroke, #f0f2f5);
    box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
    transform: none;
  }

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
  @media (max-width: 575px) {
    padding: 0 12px;
    margin-top: 10px;
  }
`;

export const ShareTagWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
`;

export const ShareTagText = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  display: flex;
  gap: 6px;
  span {
    color: var(--color-danger);
  }
  i {
    width: 16px;
    height: 16px;
    background: rgba(115, 128, 148, 0.5);
    border-radius: 8px;
  }
`;

export const ShareButton = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-primary);
  svg {
    width: 20px;
    height: 20px;
  }
`;

export const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 24px;
  margin-top: 10px;
  margin-bottom: 22px;
  padding: 24px;
  background: rgb(255, 255, 255);
  border: 1px solid var(--Stroke, #f0f2f5);
  box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
  border-radius: 14px;

  &.market-project-header {
    margin-bottom: 0;
    padding: 0;
    border: 0;
    background: transparent;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
    box-shadow: none;
  }

  &.market-project-header-full {
    gap: 0;
    background: ${mainGlobalDark.background};
    border-radius: 14px 14px 0 0;
  }

  &.market-project-header-compact {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(0, 3fr);
    align-items: stretch;
    gap: 24px;
  }

  &.market-project-header-compact .market-project-header-left,
  &.market-project-header-compact .market-project-meta-panel {
    width: 100%;
    min-width: 0;
  }

  &.market-project-header .market-project-primary-panel,
  &.market-project-header .market-project-meta-panel {
    box-shadow: none;
  }

  &.market-project-header-full .market-project-primary-panel,
  &.market-project-header-full .market-project-meta-panel {
    background: transparent;
    border-color: transparent;
    box-shadow: none;
  }

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 16px;
    padding: 18px;
    margin-bottom: 18px;

    &.market-project-header {
      padding: 0;
    }

    &.market-project-header-full {
      gap: 0;
    }

    &.market-project-header-compact {
      display: flex;
      gap: 16px;
    }
  }

  @media (max-width: 768px) {
    gap: 20px;
    margin-top: 8px;
    padding: 16px;
    border-radius: 12px;

    &.market-project-header {
      padding: 0;
    }

    &.market-project-header-full {
      gap: 0;
      border-radius: 12px 12px 0 0;
    }

    &.market-project-header-compact {
      gap: 20px;
    }
  }
`;

export const HeaderActionsWrapperMobile = styled.div`
  display: none;
  align-items: center;
  gap: 8px;

  button {
    background: none;
    border: none;
    cursor: pointer;
    svg {
      width: 30px;
      height: 30px;
    }
  }

  @media (max-width: 1024px) {
    display: flex;
  }
`;

export const LeftHeaderWrapper = styled.div`
  width: 65%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;

  &.market-project-header-left {
    flex: 7 1 0;
    width: auto;
  }

  @media (max-width: 1024px) {
    width: 100%;

    &.market-project-header-left {
      flex: 1 1 auto;
      width: 100%;
    }
  }

  @media (max-width: 768px) {
    gap: 12px;
    width: 100%;

    .project-info {
      display: flex;
      flex-direction: row;
      width: 100%;
      gap: 8px;
      align-items: center;

      & > p {
        width: max-content;
        overflow: visible !important;
      }
    }
  }
`;

export const LeftHeaderPersonInfoWrapper = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  position: relative;
  flex-wrap: wrap;

  &.market-project-primary-panel {
    min-height: 100%;
    padding: 18px;
    gap: 10px;
    background: ${mainGlobalDark.background};
    border: 1px solid ${mainGlobalDark.border};
    border-radius: 14px 14px 0 0;
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.18);
    flex-wrap: nowrap;
    align-items: center;
  }

  &.market-project-primary-panel .project-avatar {
    flex: 0 0 88px;
    width: 88px;
    height: 88px;
  }

  &.market-project-primary-panel .project-avatar > img {
    width: 88px;
    height: 88px;
  }

  &.market-project-primary-panel .project-info {
    min-width: 0;
  }

  &.market-project-primary-panel .project-info > div {
    justify-content: flex-start;
  }

  &.market-project-primary-panel .project-avatar .rating-wrapper,
  &.market-project-primary-panel .project-avatar > span {
    width: 28px;
    height: 28px;
    font-size: 13px;
    line-height: 28px;
    right: -8px;
    top: -6px;
  }

  @media (max-width: 1024px) {
    justify-content: space-between;

    &.market-project-primary-panel {
      flex-wrap: wrap;
    }
  }

  @media (max-width: 767px) {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 12px;
    flex-direction: column;

    &.market-project-primary-panel {
      padding: 14px;
      align-items: stretch;
      gap: 14px;
      border-radius: 12px 12px 0 0;
    }

    &.market-project-primary-panel .project-avatar {
      flex-basis: 52px;
      width: 52px;
      height: 52px;
    }

    &.market-project-primary-panel .project-avatar > img {
      width: 52px;
      height: 52px;
    }

    &.market-project-primary-panel .project-info {
      flex: 1 1 auto;
      min-width: 0;
    }

    &.market-project-primary-panel .left-header-right {
      width: 100%;
      justify-content: flex-start;
      flex-wrap: wrap;
    }
  }
`;

export const LeftHeaderPersonalWrapper = styled.div`
  display: flex;
  gap: 16px;

  @media (max-width: 768px) {
    gap: 12px;
    flex-direction: row;
    align-items: center;
    width: 100%;
  }
`;

export const HeaderPersonTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 32px;
  line-height: 39px;
  color: var(--color-text-primary);

  ${LeftHeaderPersonInfoWrapper}.market-project-primary-panel & {
    color: ${mainGlobalDark.white};
    font-size: 38px;
    line-height: 44px;
    text-align: center;
  }

  @media (max-width: 767px) {
    font-size: 24px;
    line-height: 29px;

    ${LeftHeaderPersonInfoWrapper}.market-project-primary-panel & {
      font-size: 26px;
      line-height: 31px;
      text-align: left;
    }
  }

  @media (max-width: 480px) {
    font-size: 20px;
    line-height: 24px;

    ${LeftHeaderPersonInfoWrapper}.market-project-primary-panel & {
      font-size: 22px;
      line-height: 26px;
      text-align: left;
    }
  }
`;
export const SocialsWrapper = styled.div`
  display: flex;
  gap: 8px;

  .market-social-links {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .market-social-links a,
  .market-social-more {
    display: inline-flex;
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    align-items: center;
    justify-content: center;
    border: 1px solid ${mainGlobalDark.border};
    border-radius: 50%;
    background: ${mainGlobalDark.backgroundHover};
    color: ${mainGlobalDark.text};
    transition:
      background 0.18s ease,
      border-color 0.18s ease,
      color 0.18s ease;
  }

  .market-social-links a:hover {
    border-color: rgba(0, 221, 115, 0.28);
    background: #182d47;
    color: ${mainGlobalDark.positive};
    opacity: 1;
  }

  .market-social-more-popover {
    position: relative;
    z-index: 28;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .market-social-more-popover::after {
    content: "";
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 34;
    width: max(100%, 190px);
    height: 9px;
  }

  .market-social-more {
    border-color: transparent;
    background: var(--main-green, ${mainGlobalDark.positive});
    color: ${mainGlobalDark.white};
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    cursor: default;
    box-shadow: 0 8px 18px rgba(0, 221, 115, 0.18);
    outline: none;
  }

  .market-social-more-dropdown {
    position: absolute;
    top: calc(100% + 9px);
    right: 0;
    z-index: 35;
    display: flex;
    min-width: 190px;
    max-width: min(260px, calc(100vw - 32px));
    max-height: 280px;
    flex-direction: column;
    gap: 7px;
    padding: 10px;
    border: 1px solid ${mainGlobalDark.border};
    border-radius: 10px;
    background: ${mainGlobalDark.background};
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.26);
    overflow: auto;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(6px);
    transition:
      opacity 0.18s ease,
      transform 0.18s ease,
      visibility 0.18s ease;
  }

  .market-social-more-popover:hover .market-social-more-dropdown,
  .market-social-more-popover:focus-within .market-social-more-dropdown {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateY(0);
  }

  .market-social-more-dropdown a {
    display: inline-flex;
    width: 100%;
    height: auto;
    min-height: 34px;
    flex: 0 0 auto;
    justify-content: flex-start;
    gap: 9px;
    padding: 7px 9px;
    border-radius: 8px;
    background: transparent;
    color: ${mainGlobalDark.text};
    text-decoration: none;
  }

  .market-social-more-dropdown a:hover {
    background: ${mainGlobalDark.backgroundHover};
    border-color: transparent;
    color: ${mainGlobalDark.positive};
  }

  .market-social-more-dropdown .market-social-label {
    min-width: 0;
    overflow: hidden;
    color: currentColor;
    font-size: 13px;
    font-weight: var(--font-weight-medium);
    line-height: 16px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.mobile-socials {
    justify-content: center;
    flex-wrap: wrap;
  }

  @media (max-width: 480px) {
    justify-content: center;
    flex-wrap: wrap;
  }
`;

export const LeftHeaderRightWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: auto;

  ${LeftHeaderPersonInfoWrapper}.market-project-primary-panel &.left-header-right {
    margin-left: 0;
    flex: 0 0 auto;
    color: ${mainGlobalDark.text};
  }

  ${LeftHeaderPersonInfoWrapper}.market-project-primary-panel &.left-header-right svg {
    color: currentColor;
  }

  ${LeftHeaderPersonInfoWrapper}.market-project-primary-panel &.left-header-right a,
  ${LeftHeaderPersonInfoWrapper}.market-project-primary-panel &.left-header-right span {
    color: ${mainGlobalDark.text};
  }

  ${LeftHeaderPersonInfoWrapper}.market-project-primary-panel &.left-header-right .projects a svg path {
    fill: ${mainGlobalDark.textMuted};
    stroke: ${mainGlobalDark.textMuted};
  }

  ${LeftHeaderPersonInfoWrapper}.market-project-primary-panel &.left-header-right .projects a:hover svg path {
    fill: ${mainGlobalDark.positive};
    stroke: ${mainGlobalDark.positive};
  }

  ${LeftHeaderPersonInfoWrapper}.market-project-primary-panel &.left-header-right #favorite path {
    stroke: ${mainGlobalDark.text};
  }

  ${LeftHeaderPersonInfoWrapper}.market-project-primary-panel &.left-header-right a:hover,
  ${LeftHeaderPersonInfoWrapper}.market-project-primary-panel &.left-header-right button:hover {
    color: ${mainGlobalDark.positive};
  }

  &.left-header-bottom {
    display: none;
  }
  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
    &.left-header-right {
      display: none;
    }
    &.left-header-bottom {
      display: flex;
    }

    .action-button {
      position: absolute;
      right: -4px;
      top: -4px;
    }
  }
`;

export const ProjectActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  &.mobile {
    justify-content: center;
  }

  @media (max-width: 480px) {
    justify-content: center;
    flex-wrap: wrap;
  }

  &.fund-page {
    @media (max-width: 768px) {
      justify-content: center;
    }
  }

  button {
    width: 42px;
    height: 42px;
    border-radius: 21px;
    background: var(--color-white);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #f0f2f5;
    box-shadow: rgba(0, 5, 48, 0.05) 1px 2px 5px 0px;
    position: relative;
    cursor: pointer;
    transition:
      background 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease;

    @media (max-width: 768px) {
      width: 38px;
      height: 38px;
    }

    &:hover {
      background: var(--color-surface-subtle);
      border-color: rgba(115, 128, 148, 0.18);
      box-shadow: rgba(0, 5, 48, 0.08) 1px 3px 8px 0px;
      transform: translateY(-1px);
    }

    &.active {
      background: var(--main-green);
    }

    &.fill-green {
      background: var(--main-green);

      svg {
        path {
          stroke: white;
        }
      }
    }

    &.fill-yellow {
      background: #ffc702;

      svg {
        path {
          stroke: white;
        }
      }
    }

    &.fill-red {
      background: var(--main-red);

      svg {
        path {
          stroke: white;
        }
      }
    }

    .flag-icon {
      position: absolute;
      right: -4px;
      top: -4px;
      color: white;
      background: #000;
      border-radius: 10px;
      font-size: 10px;
      padding: 1px 5px;
    }
  }

  ${LeftHeaderPersonInfoWrapper}.market-project-primary-panel & button {
    background: ${mainGlobalDark.backgroundHover};
    border-color: ${mainGlobalDark.border};
    box-shadow: none;
  }

  ${LeftHeaderPersonInfoWrapper}.market-project-primary-panel & button:hover {
    background: #182d47;
    border-color: rgba(0, 221, 115, 0.24);
    box-shadow: none;
  }
`;

export const HeaderPersonDescription = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 5px;
  align-items: center;
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-muted);

  ${LeftHeaderPersonInfoWrapper}.market-project-primary-panel & {
    color: ${mainGlobalDark.text};
    font-size: 20px;
    line-height: 24px;
    justify-content: flex-start;
    text-align: left;

    p {
      color: ${mainGlobalDark.text};
      font-weight: var(--font-weight-semibold);
    }
  }

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;

    ${LeftHeaderPersonInfoWrapper}.market-project-primary-panel & {
      font-size: 15px;
      line-height: 18px;
      flex-direction: row;
      align-items: center;
    }
  }
`;

export const ProjectSymbolLine = styled.span`
  display: inline-flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
`;

export const ProjectRankBadge = styled.span<{
  $tier: "elite" | "strong" | "solid" | "base";
}>`
  position: relative;
  display: inline-flex;
  height: 24px;
  min-width: 34px;
  align-items: center;
  justify-content: center;
  padding: 0 9px;
  border: 1px solid
    ${({ $tier }) =>
      $tier === "elite"
        ? "rgba(0, 221, 115, 0.42)"
        : $tier === "strong"
          ? "rgba(72, 174, 255, 0.42)"
          : $tier === "solid"
            ? "rgba(252, 199, 5, 0.42)"
            : "rgba(151, 163, 184, 0.3)"};
  border-radius: 999px;
  background:
    ${({ $tier }) =>
      $tier === "elite"
        ? "linear-gradient(135deg, rgba(0, 221, 115, 0.2), rgba(0, 221, 115, 0.08))"
        : $tier === "strong"
          ? "linear-gradient(135deg, rgba(72, 174, 255, 0.2), rgba(72, 174, 255, 0.08))"
          : $tier === "solid"
            ? "linear-gradient(135deg, rgba(252, 199, 5, 0.2), rgba(252, 199, 5, 0.08))"
            : "rgba(255, 255, 255, 0.08)"};
  color: ${({ $tier }) =>
    $tier === "elite"
      ? mainGlobalDark.positive
      : $tier === "strong"
        ? "#48aeff"
        : $tier === "solid"
          ? "#fcc705"
          : mainGlobalDark.text};
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  cursor: help;

  &::after {
    content: attr(data-tooltip);
    position: absolute;
    left: 0;
    top: calc(100% + 9px);
    z-index: 30;
    width: max-content;
    max-width: 220px;
    padding: 8px 10px;
    border: 1px solid ${mainGlobalDark.border};
    border-radius: 8px;
    background: ${mainGlobalDark.background};
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24);
    color: ${mainGlobalDark.white};
    font-size: 12px;
    font-weight: var(--font-weight-medium);
    line-height: 15px;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-4px);
    transition:
      opacity 0.16s ease,
      transform 0.16s ease;
    white-space: normal;
  }

  &::before {
    content: "";
    position: absolute;
    left: 14px;
    top: calc(100% + 4px);
    z-index: 31;
    width: 9px;
    height: 9px;
    border-left: 1px solid ${mainGlobalDark.border};
    border-top: 1px solid ${mainGlobalDark.border};
    background: ${mainGlobalDark.background};
    opacity: 0;
    pointer-events: none;
    transform: translateY(-4px) rotate(45deg);
    transition:
      opacity 0.16s ease,
      transform 0.16s ease;
  }

  &:hover::after,
  &:focus-visible::after,
  &:hover::before,
  &:focus-visible::before {
    opacity: 1;
    transform: translateY(0);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 221, 115, 0.16);
  }
`;

export const PersonPriceWrapper = styled.div`
  display: flex;
  gap: 40px;
  width: 100%;

  &.desktop {
    flex: 0 1 280px;
    min-width: 226px;
    max-width: 304px;
  }

  ${LeftHeaderPersonInfoWrapper}.market-project-primary-panel &.desktop {
    align-self: stretch;
    flex: 1 1 0;
    min-width: 260px;
    max-width: none;
  }

  ${LeftHeaderPersonInfoWrapper}.market-project-primary-panel ${LeftHeaderRightWrapper}.left-header-right + &.desktop {
    margin-left: 10px;
  }

  &.mobile {
    display: none;
  }

  @media (max-width: 1024px) {
    &.desktop {
      flex: 1 1 260px;
      max-width: 340px;
    }
  }

  @media (max-width: 767px) {
    flex-direction: column;
    gap: 20px;

    &.desktop {
      display: none;
    }

    &.mobile {
      display: flex;
    }
  }

  @media (max-width: 480px) {
    gap: 16px;
  }
`;

export const PriceInfoWrapper = styled.div`
  position: relative;
  overflow: visible;
  width: 100%;
  padding: 12px 14px;
  background: ${mainGlobalDark.background};
  border: 1px solid ${mainGlobalDark.border};
  border-radius: 12px;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.18);

  .market-project-primary-panel &,
  .market-project-meta-panel & {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background:
      linear-gradient(135deg, rgba(0, 221, 115, 0.1), rgba(0, 221, 115, 0) 42%),
      ${mainGlobalDark.backgroundHover};
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 14px 28px rgba(0, 0, 0, 0.2);
  }

  .market-project-header & {
    box-shadow: none;
  }

  &.market-header-price-card {
    min-width: 0;
  }

  &.market-header-price-card.is-loading::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 2;
    border-radius: inherit;
    background: #000;
    pointer-events: none;
    animation: ${marketHeaderPriceLoadingPulse} 1.55s ease-in-out infinite;
  }

  &.market-header-price-card.is-loading .market-header-price-body {
    filter: brightness(0.72);
  }

  .market-header-price-body {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    transition: filter 0.22s ease;
  }

  .market-header-price-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-width: 0;
  }

  .market-header-price-main {
    display: flex;
    align-items: center;
    min-width: 0;
    flex: 1 1 auto;
  }

  .market-header-price-main > p {
    margin-bottom: 0 !important;
  }

  .market-header-price-select.small-select.market-project-select {
    z-index: 4;
    flex: 0 0 84px;
    width: 84px;
    min-width: 84px;
    height: 30px;

    button {
      height: 30px;
      padding: 6px 9px;
      border-radius: 8px;
      font-size: 12px;
      line-height: 14px;
    }

    .selected-value {
      gap: 6px;
    }

    .arrow {
      height: 12px;
    }

    svg {
      width: 12px;
      height: 12px;
    }
  }

  .market-header-price-select.small-select.market-project-select > div {
    top: calc(100% + 2px);
  }

  .market-project-primary-panel & .market-header-price-range,
  .market-project-meta-panel & .market-header-price-range {
    gap: 8px;
  }

  .market-project-primary-panel & .market-header-price-range p,
  .market-project-meta-panel & .market-header-price-range p {
    color: ${mainGlobalDark.textMuted};
  }

  .market-project-primary-panel & .market-header-price-range .description-value,
  .market-project-meta-panel & .market-header-price-range .description-value {
    color: ${mainGlobalDark.white} !important;
  }

  .market-project-primary-panel & .market-header-price-range > div:first-of-type,
  .market-project-meta-panel & .market-header-price-range > div:first-of-type {
    background: rgba(255, 255, 255, 0.12);
  }

  .market-project-primary-panel & .market-header-price-range > div:first-of-type > div,
  .market-project-meta-panel & .market-header-price-range > div:first-of-type > div {
    background: linear-gradient(90deg, ${mainGlobalDark.positive} 0%, #5cf0a8 100%);
    box-shadow: 0 0 12px rgba(0, 221, 115, 0.2);
  }

  &.active {
    background: var(--main-green);
  }

  &.fill-green {
    background: var(--main-green);

    svg {
      path {
        stroke: white;
      }
    }
  }

  &.fill-yellow {
    background: #ffc702;

    svg {
      path {
        stroke: white;
      }
    }
  }

  &.fill-red {
    background: var(--main-red);

    svg {
      path {
        stroke: white;
      }
    }
  }

  .flag-icon {
    position: absolute;
    right: -4px;
    top: -4px;
    color: white;
    background: #000;
    border-radius: 10px;
    font-size: 10px;
    padding: 1px 5px;
  }
`;

export const PersonCurrencyWrapper = styled.div`
  .with-select {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding-bottom: 8px;
  }

  @media (max-width: 767px) {
    display: flex;
    gap: 14px;
    align-items: flex-end;
  }
`;
export const EditWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

export const PersonPriceTitle = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: ${mainGlobalDark.textMuted};
  margin-bottom: 4px !important;
`;

export const PersonMainPrice = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 22px;
  line-height: 27px;
  color: ${mainGlobalDark.white};
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px !important;
  min-width: 0;
  flex-wrap: wrap;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 12px;
    line-height: 12px;
    color: ${mainGlobalDark.positive};
    padding: 5px 7px;
    background: rgba(0, 221, 115, 0.12);
    border: 1px solid rgba(0, 221, 115, 0.22);
    border-radius: 8px;

    &.negative {
      color: #ff7070;
      background: rgba(255, 88, 88, 0.13);
      border-color: rgba(255, 88, 88, 0.24);
    }
  }

  div {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 14px;
    color: #e42736;
    padding: 5px 8px;
    background: rgba(228, 39, 54, 0.06);
    border: 1px solid rgba(228, 39, 54, 0.12);
    border-radius: 8px;
  }

  @media (max-width: 767px) {
    font-size: 18px;
    line-height: 22px;
    flex-wrap: wrap;

    span {
      font-size: 12px;
      line-height: 12px;
    }
  }
`;

export const PersonPriceCurrency = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 12px;
  line-height: 14px;
  color: var(--color-text-muted);
  margin-bottom: 6px !important;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 12px;
    line-height: 14px;
    color: var(--color-primary);
  }
`;

export const ProgressWrapper = styled.div`
  width: 100%;

  & > div {
    margin-top: 0;
  }
`;

export const RightHeaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 35%;
  min-width: 0;

  &.market-project-meta-panel {
    flex: 3 1 0;
    width: auto;
    gap: 14px;
    padding: 18px;
    background: ${mainGlobalDark.background};
    border: 1px solid ${mainGlobalDark.border};
    border-radius: 14px 14px 0 0;
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.18);
  }

  &.market-project-meta-panel .header-meta-content {
    min-width: 0;
  }

  @media (max-width: 1024px) {
    width: 100%;

    &.market-project-meta-panel {
      flex: 1 1 auto;
      width: 100%;
    }
  }

  @media (max-width: 768px) {
    gap: 20px;

    &.ico {
      gap: 0px;
    }

    &.market-project-meta-panel {
      padding: 14px;
      border-radius: 12px 12px 0 0;
    }
  }
`;

export const RightHeaderHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 1024px) {
    justify-content: flex-start;
    align-items: center;
    gap: 14px;
  }

  @media (max-width: 767px) {
    justify-content: flex-start;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }

  @media (max-width: 480px) {
    gap: 12px;
  }
`;

export const HeaderEditButton = styled.button`
  background: var(--color-white);
  border: 1px solid rgba(83, 98, 124, 0.07);
  box-shadow: 2px 2px 0 #eeeeee;
  border-radius: 8px;
  padding: 8px;
  width: 32px;
  height: 32px;
  margin-right: 12px;
  svg {
    width: 16px !important;
    height: 16px !important;
  }
`;

export const EditStateWrapper = styled.div`
  input {
    padding: 4px 8px;
    height: 38px;
    border-radius: 6px;
    background: var(--input-edit-bg);
    border: none;
    transition: all 0.3s ease;
    font-size: 14px;

    &::placeholder {
      color: var(--color-text-muted);
    }
    &:hover {
      background: var(--input-hover);
    }
    &:focus {
      background: var(--input-active);
    }
  }

  textarea {
    max-width: 590px;
    height: 52px;
    width: 100%;
    padding: 4px 8px;
    border-radius: 6px;
    background: var(--input-edit-bg);
    border: none;
    transition: all 0.3s ease;
    font-size: 14px;

    &::placeholder {
      color: var(--color-text-muted);
    }
    &:hover {
      background: var(--input-hover);
    }
    &:focus {
      background: var(--input-active);
    }
  }
`;

export const HeaderDataTextWrapper = styled.div`
  margin-top: 17px;
  display: flex;
  gap: 24px;
  align-items: center;
`;

export const HeaderDataText = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-text-primary);
  display: flex;
  flex-direction: column;
  gap: 4px;

  span {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
  }

  @media (max-width: 767px) {
    font-size: 18px;
    line-height: 22px;

    span {
      font-size: 12px;
      line-height: 14px;
    }
  }
`;

export const HeaderActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  button {
    background: none;
    border: none;
    cursor: pointer;
    svg {
      width: 30px;
      height: 30px;
    }
  }

  @media (max-width: 1024px) {
    display: none;
  }
`;

const marketHeaderDescriptionMarquee = keyframes`
  0%,
  12% {
    transform: translate3d(0, 0, 0);
  }

  88%,
  100% {
    transform: translate3d(
      calc(-1 * var(--description-marquee-distance, 0px)),
      0,
      0
    );
  }
`;

export const HeaderDescription = styled.span`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 20px;
  color: ${mainGlobalDark.white};
  white-space: normal !important;
  position: relative;
  display: block;
  padding: 12px 13px;
  border: 1px solid ${mainGlobalDark.border};
  border-radius: 12px;
  background: ${mainGlobalDark.background};
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);

  ${RightHeaderWrapper}.market-project-meta-panel & {
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  ${RightHeaderWrapper}.market-project-meta-panel &.truncated {
    display: flex;
    align-items: baseline;
    width: 100%;
    max-height: none;
    overflow: hidden;
    white-space: nowrap !important;
    text-overflow: clip;
    -webkit-line-clamp: initial;
    -webkit-box-orient: initial;
  }

  ${RightHeaderWrapper}.market-project-meta-panel & .description-preview-viewport {
    display: block;
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    mask-image: linear-gradient(
      90deg,
      #000 0,
      #000 calc(100% - 22px),
      rgba(0, 0, 0, 0)
    );
  }

  ${RightHeaderWrapper}.market-project-meta-panel &.with-see-more .description-preview-viewport {
    margin-right: 4px;
  }

  ${RightHeaderWrapper}.market-project-meta-panel & .description-preview-text {
    display: inline-block;
    min-width: max-content;
    overflow: visible;
    text-overflow: clip;
    white-space: nowrap;
    transform: translate3d(0, 0, 0);
    will-change: transform;
  }

  ${RightHeaderWrapper}.market-project-meta-panel &.is-marquee .description-preview-text {
    padding-right: 32px;
    animation: ${marketHeaderDescriptionMarquee}
      var(--description-marquee-duration, 18s)
      ease-in-out
      infinite;
  }

  ${RightHeaderWrapper}.market-project-meta-panel &:hover .description-preview-text,
  ${RightHeaderWrapper}.market-project-meta-panel &:focus-within .description-preview-text {
    animation-play-state: paused;
  }

  @media (prefers-reduced-motion: reduce) {
    ${RightHeaderWrapper}.market-project-meta-panel &.is-marquee .description-preview-text {
      max-width: 100%;
      min-width: 0;
      padding-right: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      animation: none;
      will-change: auto;
    }
  }

  &.truncated {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    max-height: 60px;
  }

  &.truncated.with-see-more {
    padding-right: 94px;
  }

  ${RightHeaderWrapper}.market-project-meta-panel &.truncated.with-see-more {
    padding-right: 0;
  }

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;

    &.truncated {
      max-height: 48px;
    }

    &.truncated.with-see-more {
      padding-right: 86px;
    }
  }
`;

export const HeaderDescriptionSeeMoreLink = styled.a`
  flex: 0 0 auto;
  color: ${mainGlobalDark.positive};
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

export const SeeMoreButton = styled.button`
  position: absolute;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    rgba(12, 26, 43, 0),
    ${mainGlobalDark.background} 24px,
    ${mainGlobalDark.background}
  );
  border: none;
  color: ${mainGlobalDark.positive};
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  padding: 0 0 0 28px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  height: 20px;

  &.after-description {
    position: static;
    background: none;
    display: inline-block;
    height: auto;
    margin-top: 4px;
    padding: 4px 0;
  }

  &:hover {
    text-decoration: underline;
  }
`;

export const HeaderDescriptionItemsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 16px;

  ${RightHeaderWrapper}.market-project-meta-panel & {
    margin-top: 18px;
    gap: 12px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    flex-wrap: nowrap;
  }

  ${RightHeaderWrapper}.market-project-meta-panel & > div {
    min-width: 0;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 0;
  }

  & > div {
    min-width: 150px;
  }

  @media (max-width: 768px) {
    margin-top: 16px;

    & > div {
      display: flex;
      flex-direction: column-reverse;
      gap: 8px;
    }

    ${RightHeaderWrapper}.market-project-meta-panel & {
      gap: 10px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    ${RightHeaderWrapper}.market-project-meta-panel & > div {
      flex-direction: column;
      gap: 0;
    }
  }

  @media (max-width: 420px) {
    ${RightHeaderWrapper}.market-project-meta-panel & {
      gap: 8px;
    }
  }
`;

export const HeaderDescriptionItemsTitle = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 13px;
  line-height: 16px;
  color: ${mainGlobalDark.textMuted};
  display: flex;
  align-items: center;
  gap: 4px;

  ${RightHeaderWrapper}.market-project-meta-panel & {
    display: block;
    min-height: 16px;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const HeaderCategories = styled.div`
  width: fit-content;
  max-width: 100%;
  margin-top: 8px;
  padding: 7px 10px;
  border: 1px solid ${mainGlobalDark.border};
  border-radius: 8px;
  background: ${mainGlobalDark.background};
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 16px;
  color: ${mainGlobalDark.white};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;

  ${RightHeaderWrapper}.market-project-meta-panel & {
    background: ${mainGlobalDark.backgroundHover};
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    width: 100%;
    min-height: 34px;
    height: 34px;
  }

  ${RightHeaderWrapper}.market-project-meta-panel &.has-hidden-categories {
    overflow: visible;
  }

  ${RightHeaderWrapper}.market-project-meta-panel & .header-category-main {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
  }

  ${RightHeaderWrapper}.market-project-meta-panel &.has-hidden-categories .header-category-main {
    max-width: calc(100% - 34px);
  }

  ${RightHeaderWrapper}.market-project-meta-panel & .header-category-icon {
    width: 16px;
    height: 16px;
    flex: 0 0 16px;
    color: ${mainGlobalDark.textMuted};
    display: inline-flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 16px;
      height: 16px;
      display: block;
    }
  }

  ${RightHeaderWrapper}.market-project-meta-panel & .header-category-text {
    display: inline-block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  ${RightHeaderWrapper}.market-project-meta-panel & .hidden-categories-popover {
    position: relative;
    z-index: 24;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  ${RightHeaderWrapper}.market-project-meta-panel & .hidden-categories-count {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--main-green, ${mainGlobalDark.positive});
    color: ${mainGlobalDark.white};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 1;
    cursor: default;
    box-shadow: 0 8px 18px rgba(0, 221, 115, 0.18);
  }

  ${RightHeaderWrapper}.market-project-meta-panel & .hidden-categories-dropdown {
    position: absolute;
    top: calc(100% + 9px);
    right: 0;
    z-index: 35;
    min-width: 176px;
    max-width: min(260px, calc(100vw - 32px));
    max-height: 240px;
    padding: 10px;
    border: 1px solid ${mainGlobalDark.border};
    border-radius: 10px;
    background: ${mainGlobalDark.background};
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.26);
    display: flex;
    flex-direction: column;
    gap: 7px;
    overflow: auto;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(6px);
    transition:
      opacity 0.18s ease,
      transform 0.18s ease,
      visibility 0.18s ease;
  }

  ${RightHeaderWrapper}.market-project-meta-panel & .hidden-categories-popover:hover .hidden-categories-dropdown,
  ${RightHeaderWrapper}.market-project-meta-panel & .hidden-categories-popover:focus-within .hidden-categories-dropdown {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateY(0);
  }

  ${RightHeaderWrapper}.market-project-meta-panel & .hidden-category-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    color: ${mainGlobalDark.text};
    font-size: 13px;
    font-weight: var(--font-weight-medium);
    line-height: 17px;
    white-space: nowrap;

    svg {
      width: 16px;
      height: 16px;
      flex: 0 0 16px;
      color: ${mainGlobalDark.textMuted};
    }

    span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  @media (max-width: 480px) {
    padding: 6px 8px;
    font-size: 13px;
    line-height: 16px;

    ${RightHeaderWrapper}.market-project-meta-panel & {
      gap: 6px;
      min-height: 32px;
      height: 32px;
    }

    ${RightHeaderWrapper}.market-project-meta-panel &.has-hidden-categories .header-category-main {
      max-width: calc(100% - 30px);
    }

    ${RightHeaderWrapper}.market-project-meta-panel & .hidden-categories-count {
      width: 24px;
      height: 24px;
      font-size: 11px;
    }
  }
`;

export const HeaderCopyKey = styled.div`
  border-radius: 8px;
  display: flex;
  gap: 8px;
  cursor: pointer;
  align-items: center;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;
  color: ${mainGlobalDark.white};
  margin-top: 8px;
  padding: 7px 10px;
  border: 1px solid ${mainGlobalDark.border};
  background: ${mainGlobalDark.background};
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    border-color: rgba(0, 221, 115, 0.28);
    background: ${mainGlobalDark.backgroundHover};
  }

  ${RightHeaderWrapper}.market-project-meta-panel & {
    background: ${mainGlobalDark.backgroundHover};
  }
`;

export const HeaderUsersRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const HeaderUserWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 7px;
`;

export const ProjectDescriptionDataWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 64px;
  margin-top: 17px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f8f8f9;

  @media (max-width: 1024px) {
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 32px;
  }
  @media (max-width: 767px) {
    gap: 24px;
    margin-top: 15px;
    padding-bottom: 12px;
  }

  @media (max-width: 480px) {
    gap: 16px;
  }
`;

export const ProjectDescriptionItem = styled(Typography)<{
  percentage?: number;
}>`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-primary);
  display: flex;
  flex-direction: column;
  gap: 5px;

  span {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-text-muted);
  }

  i {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: ${({ percentage = 0 }) => {
      if (percentage > 10) return "var(--color-primary)";
      if (percentage > 0) return "var(--color-text-muted)";
      return "var(--color-danger)";
    }};
  }

  @media (max-width: 767px) {
    font-size: 12px;
    line-height: 14px;

    span {
      font-size: 14px;
      line-height: 17px;
    }
    i {
      font-size: 12px;
      line-height: 14px;
    }
  }
`;
export const NewsWrapper = styled.div`
  width: calc(100% - (100% - 1204px) / 2);
  margin-left: calc((100% - 1204px) / 2);
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const RatingMediaWrapper = styled.div`
  margin-top: 64px;
`;

export const RatingMediaList = styled.ul`
  margin-top: 16px;
`;

export const RatingMediaListItem = styled.li`
  a {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-primary);
    display: flex;
    gap: 7px;
    align-items: center;
  }
  &:not(:first-child) {
    margin-top: 12px;
  }
`;

export const PageTabsWrapper = styled.div`
  margin-top: 24px;
`;

export const TabsContentWrapper = styled.div`
  display: flex;
  gap: 30px !important;
  margin-top: 40px;

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 20px !important;
    margin-top: 30px;
  }

  @media (max-width: 768px) {
    gap: 16px !important;
    margin-top: 16px;
  }
`;

export const TabsScrollAnchor = styled.div`
  scroll-margin-top: 24px;
`;

export const TabsWrapper = styled.div`
  width: 100%;
  margin-top: 24px;

  &.market-project-tabs,
  &.sticky-project-tabs {
    position: sticky;
    top: 0;
    z-index: 25;
    background: var(--color-white);
  }

  &.market-project-tabs {
    padding: 0;
    border-bottom: 1px solid #edf0f4;
    border-radius: 0;
    background: var(--color-white);

    > div {
      gap: 6px;
      padding: 0;
      border: 0;
      border-bottom: 0;
      border-radius: 0;
      background: transparent;
    }

    .tab-wrapper {
      width: 100%;
      flex: 1 1 0;
      min-width: 0;
    }

    .tab {
      min-height: 34px;
      padding: 9px 12px 10px;
      border: 0;
      border-bottom: 2px solid transparent;
      border-radius: 0;
      background: transparent;
      color: var(--color-text-muted);
      font-size: 24px;
      font-weight: var(--font-weight-semibold);
      line-height: 29px;
      transition:
        background 0.2s ease,
        border-color 0.2s ease,
        color 0.2s ease,
        box-shadow 0.2s ease;
    }

    .tab:hover {
      background: rgba(12, 26, 43, 0.04);
      border-color: transparent;
      color: var(--main-black);
    }

    .tab.active {
      background: transparent;
      border-color: var(--main-black);
      box-shadow: none;
      color: var(--main-black);
    }

    @media (max-width: 768px) {
      position: sticky;
      top: 0;
      margin-top: 16px;
      margin-left: -12px;
      margin-right: -12px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(10px);

      > div {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }

      > div::-webkit-scrollbar {
        display: none;
      }

      .tab-wrapper {
        width: auto;
        flex: 0 0 auto;
      }

      .tab {
        min-height: 38px;
        padding: 8px 12px;
        font-size: 20px;
        line-height: 24px;
      }
    }

    @media (max-width: 480px) {
      .tab {
        min-height: 36px;
        padding: 8px 10px;
        font-size: 18px;
        line-height: 22px;
      }
    }
  }

  .mobile-tabs {
    overflow-x: auto;
    white-space: nowrap;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

export const ProgressMinWrapper = styled.div`
  width: 100%;
`;

export const RangeTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
`;

export const RangeWrapper = styled.div`
  position: relative;
  border-radius: 8px;
  height: 8px;
  background: rgb(243, 244, 246);
  margin-top: 8px;
  margin-bottom: 13px;
`;

export const RangeValue = styled.div<{ percentage: number }>`
  background: linear-gradient(270deg, var(--color-primary) 0%, var(--color-primary) 100%);
  border-radius: 8px;
  height: 8px;
  width: ${({ percentage }) => percentage}%;
`;

export const RangeDescriptionWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const RangeDescription = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-primary);
  display: flex;
  gap: 10px;

  span {
    color: var(--color-text-muted);
  }
  i {
    color: var(--color-text-primary);
  }
`;

export const CommentsTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-muted);
`;
export const FlagsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 40px;
`;

export const FlagsTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-muted);
`;

export const FlagsListsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 16px;
  gap: 20px;

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 24px;
  }
`;

export const FlagsList = styled(BaseCard)`
  width: 100%;
  background: rgb(255, 255, 255);
  border: 1px solid var(--Stroke, #f0f2f5);
  box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
  border-radius: 12px;
`;

export const FlagsListTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-muted);
  margin-bottom: 12px !important;
`;

export const FlagsListItem = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-primary);
  width: max-content;
  margin-bottom: 12px;

  span {
    display: block;
    max-width: 360px;
  }
`;

export const ShareHeadWrapper = styled.div`
  display: flex;
  align-items: center;
`;

export const EditBtnsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 12px;
`;

export const ProjectDatePicketWrapper = styled.div`
  button {
    max-width: 120px;
  }
`;

export const RightColumn = styled.div`
  width: 35%;
  min-width: 0;

  @media (max-width: 1024px) {
    width: 100%;
  }
`;

export const LeftColumn = styled.div`
  max-width: 65%;
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 1024px) {
    max-width: 100%;
    gap: 24px;
  }

  @media (max-width: 768px) {
    gap: 20px;
  }
`;

export const UnlocksFullWidthSection = styled.div`
  width: 100%;
  margin-top: 24px;
  min-width: 0;
`;

export const UnlocksNarrowSection = styled.div`
  width: 65%;
  max-width: 65%;
  margin-top: 24px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 1024px) {
    width: 100%;
    max-width: 100%;
    gap: 24px;
  }

  @media (max-width: 768px) {
    gap: 20px;
  }
`;

export const RightColumnTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    font-weight: var(--font-weight-semibold);
    font-size: 18px;
    line-height: 22px;
    color: var(--color-text-primary);
    margin: 0;
  }

  button {
    width: 32px;
    height: 32px;
    border: 1px solid #f0f2f5;
    border-radius: 8px;
    background: var(--color-white);
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: var(--color-surface-subtle);
      border-color: rgba(115, 128, 148, 0.18);
    }
  }
`;

export const FundraisingWrapper = styled.div`
  width: 100%;
`;
export const StatisticsCardsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;

  h2 {
    margin: 6px 0 0;
    color: var(--color-text-primary);
    font-size: 18px;
    line-height: 22px;
    font-weight: var(--font-weight-semibold);
  }

  & > h2:first-child,
  & > ${RightColumnTitle}:first-child {
    margin-top: 0;
  }

  @media (max-width: 1024px) {
    &.slider-active {
      .swiper {
        width: 100%;
        padding-bottom: 34px;
        overflow: visible;
      }

      .swiper-wrapper {
        align-items: stretch;
      }

      .swiper-slide {
        height: auto;
      }

      .swiper-pagination {
        bottom: 0;
      }

      .swiper-pagination-bullet {
        background: var(--color-text-muted);
        opacity: 0.5;
      }

      .swiper-pagination-bullet-active {
        background: var(--color-primary);
        opacity: 1;
      }

      /* Each card gets full width in slider */
      .swiper-slide > * {
        width: 100%;
        margin-bottom: 0;
      }
    }
  }

  @media (max-width: 768px) {
    gap: 14px;

    h2 {
      margin-top: 0;
      font-size: 16px;
      line-height: 20px;
    }
  }
`;

export const MobileRoiSection = styled.div`
  display: none;

  @media (max-width: 1024px) {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 16px;

    h2 {
      margin: 0;
      color: var(--color-text-primary);
      font-size: 18px;
      line-height: 22px;
      font-weight: var(--font-weight-semibold);
    }

    & > div {
      height: auto;
    }
  }

  @media (max-width: 575px) {
    margin-top: 12px;

    h2 {
      font-size: 16px;
      line-height: 20px;
    }
  }
`;

export const XPerformanceNotice = styled.div`
  display: flex;
  width: 100%;
  min-height: 54px;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid var(--Stroke, #f0f2f5);
  border-radius: 12px;
  background: var(--color-white);
  box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ActionsPopoverTrigger = styled.button`
  &.socials-trigger {
    right: 32px;
  }

  width: 30px;
  height: 30px;
  border-radius: 21px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  position: absolute;
  top: 0;
  right: 0;

  @media (max-width: 1024px) {
    border: 1px solid rgba(0, 221, 115, 0.32);
    background: rgba(0, 221, 115, 0.08);
    color: var(--main-green, ${mainGlobalDark.positive});
    box-shadow: 0 6px 14px rgba(0, 221, 115, 0.12);

    svg,
    svg path {
      color: var(--main-green, ${mainGlobalDark.positive});
      stroke: currentColor;
    }
  }

  @media (max-width: 768px) {
    top: 14px;
    right: 14px;

    &.socials-trigger {
      right: 52px;
    }
  }

  &:hover {
    background: rgba(0, 221, 115, 0.14);
  }
`;

export const PopoverOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
`;

export const ActionsPopover = styled.div`
  position: absolute;
  top: 50px;
  right: 0;
  background: white;
  border: 1px solid rgba(83, 98, 124, 0.07);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 50;
  min-width: 120px;
  padding: 12px;

  @media (max-width: 575px) {
    top: 40px;
    max-width: calc(100vw - 24px);
    padding: 9px;
  }

  .projects {
    display: flex;
    flex-direction: column;
    gap: 20px;

    & > a {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;

      &:hover {
        background: rgba(83, 98, 124, 0.07);
      }
    }
  }
`;

export const PopoverActionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  .market-social-links.with-labels {
    display: flex;
    min-width: 180px;
    flex-direction: column;
    gap: 8px;
  }

  .market-social-links.with-labels a {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    color: var(--color-text-primary);
    text-decoration: none;

    &:hover {
      background: rgba(83, 98, 124, 0.07);
    }
  }

  .market-social-label {
    font-weight: var(--font-weight-medium);
    font-size: 14px;
    line-height: 16px;
  }

  & > button {
    display: flex;
    width: 100%;
    text-align: left;
    padding: 8px 12px;
    border: none;
    background: none;
    cursor: pointer;
    gap: 8px;

    span {
      font-weight: var(--font-weight-medium);
      font-size: 14px;
      line-height: 16px;
      color: var(--color-text-primary);
    }

    &:hover {
      background: rgba(83, 98, 124, 0.07);
    }
  }
`;

export const ActionsPopoverOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
`;

export const ActionsPopoverContent = styled.div`
  position: absolute;
  top: 50px;
  right: 0;
  background: white;
  border: 1px solid rgba(83, 98, 124, 0.07);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 50;
  padding: 8px;
  min-width: 120px;
`;

export const ActionsTriggerButton = styled.button`
  width: 42px;
  height: 42px;
  border-radius: 21px;
  background: #f5f6f7;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;

  &:hover {
    background: var(--color-surface-subtle);
  }
`;

export const SmartsWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;

  ${RightHeaderWrapper}.market-project-meta-panel & {
    width: 100%;
    min-width: 0;
  }

  ${RightHeaderWrapper}.market-project-meta-panel & > button {
    max-width: 100%;
    min-width: 0;
    min-height: 16px;
    padding: 0;
    border: 0;
    background: transparent;
    text-align: left;
  }

  & .search-dropdown {
    position: absolute;
    top: 48px;
    left: 0px;
    z-index: 20;
    background: ${mainGlobalDark.background};
    padding: 16px;
    border: 1px solid ${mainGlobalDark.border};
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.24);
    border-radius: 12px;
    max-height: 200px;
    overflow: auto;

    display: none;
    flex-direction: column;
    gap: 8px;

    a {
      color: ${mainGlobalDark.textMuted};
      font-size: 14px;
    }
  }

  &:hover .search-dropdown {
    display: flex;
  }

  &.is-open .search-dropdown {
    display: flex;
  }

  & .smart-info {
    display: flex;
    align-items: center;
    gap: 6px;

    span {
      font-size: 14px;
      font-weight: var(--font-weight-medium);
      color: ${mainGlobalDark.text};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: inline-block;
    }
  }

  & .smart-wrapper {
    margin-bottom: 8px;

    button {
      border: 0;
      padding: 0;
      background: transparent;
    }
  }

  @media (max-width: 768px) {
    & .search-dropdown {
      top: calc(100% + 10px);
      left: 0;
      width: min(320px, calc(100vw - 28px));
      max-height: 260px;
      padding: 12px;
      gap: 10px;
      overscroll-behavior: contain;
    }

    & .smart-wrapper {
      margin-bottom: 0;
    }

    & .smart-info span {
      max-width: 220px;
    }
  }
`;
