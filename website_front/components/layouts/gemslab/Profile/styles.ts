import styled, { keyframes } from "styled-components";
import Typography from "../../../global/common/Typography";
import BaseCard from "../../../global/common/BaseCard";

const headerDropdownEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

export const PageWrapper = styled.div`
  width: 1204px;
  margin: 0 auto;
  margin-top: 32px;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
  @media (max-width: 992px) {
    margin-top: 20px;
  }
  @media (max-width: 640px) {
    padding: 0 12px;
  }

  .button {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
  }
`;
export const HeaderPersonNameWrapper = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  @media (max-width: 768px) {
    gap: 8px;
    flex-wrap: wrap;
  }
`;

export const HeaderWrapper = styled.div`
  width: 100%;
  padding-bottom: 20px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  position: relative;

  @media (max-width: 992px) {
    flex-direction: column;
    padding-bottom: 12px;
    gap: 12px;
  }

  @media (max-width: 640px) {
    padding-bottom: 8px;
    gap: 10px;
  }
`;

export const HeaderActionsWrapper = styled.div``;

export const HeaderColumn = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;

  @media (max-width: 992px) {
    width: 100%;
  }
`;

export const HeaderPrimaryCard = styled.div`
  width: 100%;
  padding: 10px;
  border-radius: 12px;
  background: var(--color-white);
  box-shadow: var(--main-section-shadow);
  display: flex;
  flex-direction: column;
  gap: 6px;

  .followers-data {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .followers-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 7px 8px;
    border-radius: 12px;
    background: var(--color-surface-raised);
  }

  .followers-value {
    font-weight: var(--font-weight-semibold);
    font-size: 22px;
    line-height: 1;
    color: var(--color-text-primary);
  }

  .followers-key {
    margin-top: 4px;
    font-size: 16px;
    font-weight: var(--font-weight-medium);
    line-height: 16px;
    color: var(--main-gray);
  }

  @media (max-width: 768px) {
    padding: 14px;
    border-radius: 12px;
    gap: 12px;

    .followers-data {
      grid-template-columns: 1fr 1fr;
      row-gap: 10px;
    }

    .followers-key {
      font-size: 11px;
    }

    .followers-value {
      font-size: 24px;
    }

    .followers-item {
      justify-content: center;
      padding: 12px 14px;
    }
  }

  @media (max-width: 640px) {
    padding: 10px;
    gap: 10px;

    .followers-value {
      font-size: 20px;
    }

    .followers-key {
      font-size: 12px;
      line-height: 14px;
    }
  }

  @media (max-width: 520px) {
    .followers-data {
      grid-template-columns: 1fr;
      gap: 10px;
    }
  }
`;

export const HeaderIdentitySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const HeaderCompactRow = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 1.15fr) repeat(5, minmax(110px, 1fr));
  gap: 6px;
  align-items: stretch;

  & > div {
    height: 100%;
  }

  .header-identity-card,
  .header-network-card,
  .header-highlights-card,
  .header-badges-card {
    min-width: 0;
  }

  @media (max-width: 1320px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

export const HeaderIdentitySurface = styled.div`
  padding: 8px 9px;
  border-radius: 10px;
  background: var(--color-surface-raised);

  @media (max-width: 900px) {
    padding: 10px;
  }

  @media (max-width: 520px) {
    padding: 8px;
  }
`;

export const HeaderIdentityMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: fit-content;
    font-size: 13px;
    font-weight: var(--font-weight-semibold);
    line-height: 15px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6f7d90;

    svg {
      color: var(--main-green);
      flex-shrink: 0;
    }
  }

  @media (max-width: 640px) {
    gap: 4px;

    .eyebrow {
      font-size: 11px;
      line-height: 13px;
    }
  }
`;

export const HeaderSupplementaryGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const HeaderSectionCard = styled.div`
  min-width: 0;
  position: relative;
  border-radius: 12px;
  background: var(--color-white);
  padding: 7px 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;

  &.social-links-card .projects {
    margin: 0;
  }

  .header-dropdown-trigger {
    width: 100%;
    min-height: 54px;
    padding: 8px;
    position: static;
    border: none;
    border-radius: 10px;
    background: var(--color-surface-raised);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    text-align: left;
    justify-content: center;
    box-shadow: none;
    transition: background 0.2s ease;

    &:hover {
      background: #E9F8F8;
    }
  }

  .header-dropdown-trigger.header-dropdown-trigger-blue:hover,
  .header-dropdown-trigger.header-dropdown-trigger-blue:focus-visible {
    background: #eef6ff !important;
  }

  .header-dropdown-trigger:disabled {
    cursor: default;
  }

  .header-dropdown-trigger.header-dropdown-trigger-blue:disabled:hover {
    background: var(--color-surface-raised) !important;
  }

  .header-dropdown-head {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    margin-bottom: 4px;

    svg:last-child {
      color: #8d98a9;
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }
  }

  .header-dropdown-trigger.is-open .header-dropdown-head svg:last-child {
    transform: rotate(180deg);
  }

  .header-dropdown-meta {
    font-size: 14px;
    line-height: 14px;
    color: var(--main-gray);
  }

  .header-dropdown-panel {
    position: absolute;
    top: calc(100% - 15px);
    left: 8px;
    right: 8px;
    z-index: 50;
    padding: 8px;
    border-radius: 12px;
    border: 1px solid var(--main-stroke);
    background: var(--color-white);
    box-shadow: var(--main-section-shadow);
    transform-origin: top center;
    will-change: opacity, transform;
    animation: ${headerDropdownEnter} 0.24s cubic-bezier(0.22, 1, 0.36, 1)
      both;
  }

  .header-dropdown-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .header-dropdown-list.projects {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    margin: 0;
  }

  .header-dropdown-list.projects > a,
  .header-dropdown-button,
  .header-dropdown-info {
    min-height: 38px;
    width: 100%;
    padding: 8px 10px;
    border-radius: 10px;
    background: var(--color-surface-raised);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header-dropdown-list.projects > a {
    color: var(--color-text-primary);

    span {
      font-size: 14px;
      line-height: 17px;
      color: var(--color-text-primary);
    }

    &:hover {
      background: #f1f5f9;
      opacity: 1;
    }
  }

  .header-dropdown-button {
    border: none;
    cursor: pointer;
    text-align: left;

    span {
      font-size: 14px;
      line-height: 17px;
      color: var(--color-text-primary);
    }

    &:hover {
      background: #f1f5f9;
    }
  }

  .header-dropdown-button strong,
  .header-dropdown-info strong {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  .header-dropdown-info {
    justify-content: space-between;
    font-size: 13px;
    line-height: 16px;
    color: #8d98a9;
  }

  .header-dropdown-empty {
    min-height: 38px;
    padding: 10px;
    border-radius: 10px;
    background: var(--color-surface-raised);
    font-size: 13px;
    line-height: 16px;
    color: #8d98a9;
  }

  .header-highlights-list {
    gap: 6px;

    & > div {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      min-height: 38px;
      margin: 0;
      padding: 8px 10px;
      border-radius: 10px;
      background: var(--color-surface-raised);
      justify-content: flex-start;

      svg {
        flex: 0 0 auto;
        color: var(--main-blue);
      }

      span {
        min-width: 0;
        overflow-wrap: anywhere;
        font-size: 14px;
        line-height: 17px;
        color: var(--color-text-primary);
      }
    }
  }

  .header-badges-panel {
    .badges-row {
      gap: 6px;
    }
  }

  @media (max-width: 768px) {
    padding: 10px 12px;
    border-radius: 12px;
    gap: 8px;
  }

  @media (max-width: 1024px) {
    .header-dropdown-panel {
      top: calc(100% + 4px);
      left: 0;
      right: 0;
    }
  }

  @media (max-width: 640px) {
    padding: 8px;

    .header-dropdown-trigger {
      min-height: 48px;
      padding: 8px;
    }

    .header-dropdown-meta {
      font-size: 12px;
      line-height: 13px;
    }

    .header-dropdown-list.projects > a,
    .header-dropdown-button,
    .header-dropdown-info {
      min-height: 36px;
      padding: 8px;
    }

    .header-dropdown-list.projects > a span,
    .header-dropdown-button span {
      font-size: 13px;
      line-height: 15px;
    }
  }
`;

export const HeaderSectionTitle = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 16px;
  font-weight: var(--font-weight-medium);
  line-height: 15px;
  color: var(--main-black);

  svg {
    color: var(--main-green);
    flex-shrink: 0;
  }

  @media (max-width: 640px) {
    font-size: 14px;
    line-height: 16px;
  }

  &.header-section-title-blue {
    color: var(--main-blue);

    svg,
    svg path {
      color: var(--main-blue);
      stroke: var(--main-blue);
    }
  }

  &.header-section-title-green {
    color: var(--main-green);

    svg {
      color: var(--main-green);
    }
  }

  @media (max-width: 768px) {
    svg,
    svg path {
      color: inherit;
      stroke: currentColor;
    }
  }
`;

export const HeaderDetails = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 6px;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid var(--main-stroke);
  background: var(--color-white);
  box-shadow: var(--main-section-shadow);

  & .followers-data {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;

    & .followers-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      padding: 7px 8px;
      border-radius: 12px;
      background: var(--color-surface-raised);
    }

    & .followers-value {
      font-weight: var(--font-weight-semibold);
      font-size: 18px;
      line-height: 1;
      color: var(--color-text-primary);
    }

    & .followers-key {
      font-size: 14px;
      font-weight: var(--font-weight-medium);
      line-height: 16px;
      text-transform: uppercase;
      color: var(--main-gray);
    }
  }

  .social-links-card .projects {
    margin: 0;
  }

  .mobile-actions-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .mobile-action-slot {
    position: relative;
  }

  .mobile-action-trigger {
    width: 100%;
    min-height: 36px;
    border-radius: 10px;
    border: 1px solid #eef2f7;
    background: var(--color-surface-raised);
    box-shadow: var(--main-section-shadow);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mobile-action-card {
    min-height: 56px;
    padding: 10px 12px;
    justify-content: space-between;
    gap: 10px;
    position: static;

    svg:last-child {
      color: #8d98a9;
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }

    &.is-open svg:last-child {
      transform: rotate(180deg);
    }
  }

  .mobile-action-content {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .mobile-action-icon {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: #e9f8f8;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--main-green);
    flex-shrink: 0;
  }

  .mobile-action-icon-blue {
    background: #eef6ff;
  }

  .mobile-action-labels {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: left;
  }

  .mobile-action-title {
    font-size: 14px;
    line-height: 16px;
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }

  .mobile-action-meta {
    font-size: 12px;
    line-height: 14px;
    color: #8d98a9;
  }

  @media (max-width: 992px) {
    width: 100%;
    order: 3;
    margin-top: 0;
    padding: 12px;
  }
  @media (max-width: 768px) {
    .followers-data {
      grid-template-columns: 1fr 1fr;
      row-gap: 10px;

      .followers-key {
        font-size: 11px;
      }
      .followers-value {
        font-size: 24px;
      }
      .followers-item {
        justify-content: center;
        padding: 12px 14px;
      }
    }

    .mobile-actions-row {
      grid-template-columns: 1fr;
    }

    .mobile-action-card {
      min-height: 52px;
      padding: 10px;
    }
  }

  @media (max-width: 520px) {
    .followers-data {
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .mobile-action-content {
      gap: 8px;
    }

    .mobile-action-icon {
      width: 30px;
      height: 30px;
      border-radius: 9px;
    }

    .mobile-action-title {
      font-size: 13px;
      line-height: 15px;
    }

    .mobile-action-meta {
      font-size: 11px;
      line-height: 13px;
    }
  }
`;

export const HeaderActions = styled.div``;

export const LeftHeaderPersonInfoWrapper = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  & > div {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }

  h3 {
    font-weight: var(--font-weight-regular);
    font-size: 20px;
    color: var(--main-green);
  }
  img {
  }
  @media (max-width: 767px) {
    align-items: flex-start;
    flex-wrap: wrap;
    width: 100%;

    & > div {
      gap: 0;
    }

    h3 {
      font-size: 12px;
      line-height: 14px;
    }
  }
  @media (max-width: 640px) {
    flex-wrap: nowrap;
    align-items: flex-start;
    gap: 10px;

    img {
      max-width: 64px;
      max-height: 64px;
    }
  }

  @media (max-width: 520px) {
    flex-wrap: wrap;
  }
`;

export const HeaderPersonTitle = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 27px;
  color: var(--color-text-primary);

  @media (max-width: 767px) {
    font-size: 24px;
    line-height: 29px;
  }

  @media (max-width: 480px) {
    font-size: 20px;
    line-height: 24px;
  }

  @media (max-width: 640px) {
    font-size: 21px;
    line-height: 24px;
  }

  &.title-fomies {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

export const HeaderPersonDescription = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 2px;
  align-items: center;
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-muted);

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;
  }
`;

export const RightHeaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  & .right-column {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  & .right-row {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 34px;
    padding: 6px 8px;
    border-radius: 10px;
    background: var(--color-surface-raised);

    button {
      font-weight: var(--font-weight-regular);
      font-size: 12px;
      line-height: 100%;
      padding: 0px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    span {
      font-weight: var(--font-weight-regular);
      font-size: 12px;
      line-height: 100%;
    }
  }

  @media (max-width: 992px) {
    margin-top: 16px;
  }
  @media (max-width: 680px) {
    grid-template-columns: 1fr;
    gap: 16px;
    .right-column {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 8px 18px;
    }
    .right-row {
      button span {
        font-size: 12px;
      }
    }
  }
`;

export const RatingCircleWrapper = styled.div`
  margin-top: -10px;
`;

export const GradientButton = styled.div<{ big?: boolean; dark?: boolean }>`
  background: ${({ dark }) =>
    dark
      ? "linear-gradient(180deg, #04A53B 0%, #041A15 100%)"
      : "linear-gradient(180deg, #0B6920 7.29%, rgba(0, 143, 109, 0.72) 100%)"};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: ${({ big }) => (big ? 24 : 20)}px;
  display: flex;
  gap: 14px;
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  align-items: center;

  .edit {
    border: 1px solid var(--color-text-secondary)12;
    box-shadow: 2px 2px 0px var(--color-text-secondary)12;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  button {
    background: ${({ dark }) =>
      dark
        ? "linear-gradient(180deg, #04A53B 0%, #041A15 100%)"
        : "linear-gradient(180deg, #0B6920 7.29%, rgba(0, 143, 109, 0.72) 100%)"};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: ${({ big }) => (big ? 24 : 20)}px;
    font-weight: var(--font-weight-semibold);
    align-items: center;
    border: none;
    &:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }
  }
`;
export const SocialActivity = styled.div`
  display: grid;
  grid-template-columns: 1fr 200px;
  margin-top: 10px;
  margin-bottom: 10px;
  grid-gap: 20px;

  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }

  span {
    color: var(--color-text-muted);

    b {
      color: var(--color-text-primary);
    }
  }

  & > div:first-child {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    justify-content: space-between;

    & > div {
      display: flex;
      gap: 25px;
      width: 100%;
      justify-content: space-between;

      & > div:first-child {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    }
  }

  & > div:last-child {
    display: flex;
    flex-direction: column;
    gap: 10px;

    @media (max-width: 540px) {
      flex-direction: row;
      margin: auto;
    }
  }
`;

export const AvatarWrapper = styled.div`
  position: relative;
  height: 72px;
  width: 72px;
`;

export const ErrorLabel = styled.div`
  color: rgb(221, 2, 2);
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
`;

export const FileInputWrapper = styled.div`
  display: flex;
  flex-direction: column;

  input {
    opacity: 0;
    position: absolute;
    top: 0px;
    left: 0px;
    right: 0px;
    bottom: 0px;
    z-index: 1;
    cursor: pointer;
    height: 72px !important;
    width: 72px !important;
  }

  & .btn-wrapper {
    position: absolute;
    bottom: -5px;
    right: -10px;
  }
`;

export const Form = styled.div<{ big?: boolean; align?: boolean }>`
  display: flex;
  margin-top: 40px;
  margin-bottom: 40px;
  gap: 40px;
  font-size: 14px;
  overflow-x: auto;
  padding-bottom: 5px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
  }

  /* 
  .connect-wallet {
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  p {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    line-height: 30px;
    display: flex;
    align-items: center;
    gap: 5px;
  } */

  /* span {
    color: #0e7ce1;
  }

  input {
    width: 333px;
    box-shadow: 0px 1px 4px 0px #00000040;
  }

  textarea {
    box-shadow: 0px 1px 4px 0px #00000040;
    border: none;
    background: #f8f8f9;
    border-radius: 8px;
    padding: 10px 12px;
    box-sizing: border-box;
    font-weight: var(--font-weight-semibold);
    width: 100%;
    min-width: 250px;
    resize: none;

    &::placeholder {
      color: rgba(115, 128, 148, 0.5);
      font-weight: var(--font-weight-medium);
      font-size: 14px;
      line-height: 16px;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  & > div {
    display: flex;
    gap: 10px;
  }

  & > div:first-child {
    flex-direction: column;
    gap: 5px;

    b {
      font-size: 14px;
      color: #e42736;
      cursor: pointer;
    }
  }

  & > div:nth-child(2) {
    gap: 100px;

    & > div {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  }

  & > div:last-child {
    display: block;
  } */
`;

export const CheckboxList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const CheckboxWrapper = styled.div``;

export const MainInfoWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  & .user-profile-btns {
    display: flex;
    align-items: center;
    gap: 40px;
  }

  & .support-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 100%;
  }
`;

export const MainInfoRow = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  row-gap: 10px;
  column-gap: 10px;
  justify-content: space-between;
  width: 100%;
  padding: 18px 16px 24px;
  border-radius: 12px;
  background: var(--color-white);
  box-shadow: var(--main-section-shadow);

  & .profile-item {
    display: flex;
    flex-direction: column;
    min-height: 54px;
    min-width: 0;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 12px;
    border: none;
    background: var(--color-surface-raised);
    justify-content: space-between;
  }

  & .profile-item .key {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    min-height: 18px;
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    line-height: 16px;
    color: var(--main-gray);
  }

  & .profile-item .value {
    font-size: 14px;
    line-height: 18px;
    color: var(--color-text-primary);
    min-width: 0;
    overflow-wrap: anywhere;
  }

  & .profile-item .value.main-green {
    color: var(--main-green);
  }

  & .profile-item .value.main-red {
    color: var(--main-red);
  }

  & .profile-item .value.main-black {
    color: var(--main-black);
  }

  & .profile-item .action-value {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    word-break: break-word;
  }

  & .profile-item .action-value button {
    flex-shrink: 0;
  }

  & .small-item {
    display: flex !important;
    flex-direction: row-reverse !important;
    align-items: center;
    justify-content: space-between;
  }

  & .profile-info-column {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0px;
  }

  @media (max-width: 1500px) {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  @media (max-width: 1360px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  @media (max-width: 1120px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    padding: 14px;
  }
  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: 8px;
    column-gap: 8px;
    padding: 12px;

    & .profile-item {
      padding: 10px;
    }

    & .profile-item .key {
      font-size: 13px;
      line-height: 15px;
    }
  }
  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr);

    && > .profile-item {
      width: 100%;
      max-width: 100%;
      justify-self: stretch;
    }
  }
  @media (max-width: 640px) {
    row-gap: 10px;
    column-gap: 10px;
    padding: 12px;
    border-radius: 12px;

    & .profile-item {
      min-height: 88px;
      padding: 12px;
      gap: 8px;
    }

    & .profile-item .key {
      min-height: 28px;
      font-size: 12px;
      line-height: 15px;
    }

    & .profile-item .value {
      font-size: 15px;
      line-height: 18px;
    }
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
    row-gap: 8px;
    column-gap: 8px;
    padding: 10px;

    & .profile-item {
      min-height: auto;
      padding: 12px;
      gap: 8px;
    }

    & .profile-item .key {
      min-height: auto;
      font-size: 12px;
      line-height: 14px;
    }

    & .profile-item .value {
      font-size: 15px;
      line-height: 18px;
    }
  }

  @media (max-width: 420px) {
    padding: 8px;

    & .profile-item {
      padding: 10px;
      gap: 6px;
    }

    & .profile-item .key {
      font-size: 11px;
      line-height: 13px;
    }

    & .profile-item .value {
      font-size: 14px;
      line-height: 17px;
    }
  }
`;

export const DescriptionWrapper = styled.div`
  & .description-component {
    width: 300px;
    padding: 10px;
    z-index: 1;
    background: white;
    position: absolute;
    top: 30px;
    left: -10px;
    div {
      font-size: 14px;
      color: var(--main-gray);

      p {
        margin: 8px 0;
      }
    }
  }

  @media (max-width: 640px) {
    .description-component {
      left: 0;
      width: 260px;
    }
  }
`;

export const BioWrapper = styled.div`
  width: 100%;

  & .actions {
    max-width: fit-content;
    margin-top: 12px;
    margin-left: auto;
    display: flex;
    align-items: center;
    button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-radius: 8px;
      padding: 6px;
      font-weight: var(--font-weight-regular);
      font-size: 10px;
      line-height: 100%;
    }
    & .green-btn {
      transition: all 0.3s ease;
      color: var(--color-primary);
      border: 1px solid var(--color-primary);

      span {
        font-size: 10px !important;
      }

      &:hover {
        border: 1px solid #39816a;
        span {
          color: #39816a;
        }

        path {
          stroke: #39816a;
        }
      }

      &:active {
        border: 1px solid #2e6a58;
        span {
          color: #2e6a58;
        }

        path {
          stroke: #2e6a58;
        }
      }
    }

    & .reset-btn {
      width: 110px;
      color: var(--main-gray);
    }
  }

  @media (max-width: 640px) {
    .actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
`;

export const BioTitle = styled.div`
  margin-bottom: 12px;
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 100%;
  letter-spacing: 0%;
`;

export const SettingsColumns = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr 1fr;

  & .column {
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow: clip;
  }

  & .actions {
    max-width: fit-content;
    margin-left: auto;
    display: flex;
    align-items: center;
    button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-radius: 8px;
      padding: 6px;
      font-weight: var(--font-weight-regular);
      font-size: 10px;
      line-height: 100%;
    }
    & .green-btn {
      transition: all 0.3s ease;
      color: var(--color-primary);
      border: 1px solid var(--color-primary);

      span {
        font-size: 10px !important;
      }

      &:hover {
        border: 1px solid #39816a;
        span {
          color: #39816a;
        }

        path {
          stroke: #39816a;
        }
      }

      &:active {
        border: 1px solid #2e6a58;
        span {
          color: #2e6a58;
        }

        path {
          stroke: #2e6a58;
        }
      }
    }

    & .reset-btn {
      width: 110px;
      color: var(--main-gray);
    }
  }

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;

    .column {
      width: 100%;
      max-width: 100%;
    }
  }
`;

export const SettingsBlock = styled.div`
  width: 100%;
`;

export const BlockHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  .edit {
    border: 1px solid var(--color-primary);
    width: 40px;
    height: 28px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 768px) {
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 8px;

    > div {
      flex-wrap: wrap;
      justify-content: space-between;

      button {
        width: 100%;
      }
    }

    .edit {
      width: 32px;
      height: 24px;
    }
  }
`;

export const BlockBody = styled(BaseCard)`
  margin-top: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;

  input {
    background: white;
    width: 100% !important;
  }

  & .inputRootWrapper {
    width: 100%;
  }

  @media (max-width: 820px) {
    padding: 20px;
  }
  &.grid {
    display: grid;
    grid-template-columns: 1fr 1fr;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }
`;
export const LocationWrapper = styled.div``;

export const RowLabel = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 100%;
  margin-bottom: 12px;
`;
export const ConnectedWallet = styled.div`
  & .connectedWallet {
    padding: 12px 8px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;
    letter-spacing: 0%;
    color: var(--color-info);
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;

    @media (max-width: 480px) {
      max-width: 200px;
    }
  }
`;

export const SwitchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  & .switch-label {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;
    letter-spacing: 0%;
  }
`;

export const LeftHeaderColumn = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  position: relative;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
  }
`;

export const LeftHeaderColumnInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: 767px) {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

export const SponsoredRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  @media (max-width: 768px) {
    gap: 8px;
  }
`;

export const BadgesRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  .profile-badge {
    min-width: 0;
    max-width: 100%;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border-radius: 10px;
    background: var(--color-surface-raised);
    color: var(--color-text-primary);
    font-size: 13px;
    line-height: 16px;

    svg {
      width: 24px;
      height: 24px;
      flex: 0 0 24px;
    }

    span {
      min-width: 0;
      overflow-wrap: anywhere;
    }
  }

  img {
    max-width: 36px;
    max-height: 36px;
    object-fit: cover;
  }

  @media (max-width: 520px) {
    gap: 4px;
    img {
      max-width: 30px;
      max-height: 30px;
    }
  }
`;
