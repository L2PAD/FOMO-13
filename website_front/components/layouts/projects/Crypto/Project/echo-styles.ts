import styled from "styled-components";
import {
  BaseCardCryptoWrapper,
  BaseCardWrapper,
} from "../../../../global/common/BaseCard/styles";
import { ProjectImages } from "./ProjectHub/styles";
import {
  Date as FundingDate,
  FundsRaised,
  InvestorInfo,
  LeftColumn as FundingLeftColumn,
  RightColumn as FundingRightColumn,
  Round,
  RoundInfoWrapper,
  RoundProgressWrapper,
  StatisticsInfo,
  Wrapper as FundingRoundsWrapper,
} from "./FundingRounds/styles";
import {
  Content as FundraisingContent,
  MetricsContentWrapper,
  PieContentWrapper,
  RoundWrapper,
  TableWrapper,
  Title as FundraisingTitle,
} from "./Fundraising/styles";
import { Notice as DataQualityNotice } from "./DataQualityNotice/styles";
import { mainGlobalDark } from "../../../../../styles/mainGlobalDark";

export const EchoProfileScope = styled.div`
  width: 100%;
  min-width: 0;

  &.echo-profile {
    --echo-dark: ${mainGlobalDark.background};
    --echo-dark-raised: ${mainGlobalDark.backgroundHover};
    --echo-dark-border: ${mainGlobalDark.border};
    --echo-dark-text: ${mainGlobalDark.text};
    --echo-dark-text-muted: ${mainGlobalDark.textMuted};
  }

  &.echo-profile .echo-page-header {
    min-height: 28px;
    margin-bottom: 12px;
  }

  &.echo-profile .echo-hero {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(320px, 3fr);
    align-items: stretch;
    gap: 16px;
    margin-top: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  &.echo-profile .echo-identity-panel,
  &.echo-profile .echo-meta-panel {
    width: 100%;
    min-width: 0;
    padding: 18px;
    border: 1px solid var(--echo-dark-border);
    border-radius: 14px;
    background: var(--echo-dark);
    box-shadow: none;
  }

  &.echo-profile .echo-identity-panel {
    gap: 20px;
  }

  &.echo-profile .echo-identity-row {
    align-items: center;
    gap: 16px;
  }

  &.echo-profile .echo-identity-row .project-info {
    min-width: 0;
    flex: 1 1 auto;
  }

  &.echo-profile .echo-identity-row .echo-project-avatar {
    width: 88px;
    height: 88px;
    flex: 0 0 88px;
  }

  &.echo-profile .echo-identity-row .echo-project-avatar > img {
    width: 88px;
    height: 88px;
  }

  &.echo-profile .echo-project-title {
    max-width: 100%;
    color: ${mainGlobalDark.white};
    font-size: clamp(30px, 3vw, 38px);
    line-height: 1.15;
    overflow-wrap: anywhere;
  }

  &.echo-profile .echo-project-subtitle {
    min-width: 0;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 10px !important;
    row-gap: 8px !important;
  }

  &.echo-profile .echo-project-subtitle p {
    min-width: 0;
    max-width: 100%;
    color: var(--echo-dark-text);
    font-size: 15px;
    font-weight: var(--font-weight-semibold);
    line-height: 20px;
    overflow-wrap: anywhere;
  }

  &.echo-profile .echo-identity-panel .left-header-right {
    min-width: 0;
    gap: 12px;
    color: var(--echo-dark-text);
  }

  &.echo-profile .echo-identity-panel .left-header-right button,
  &.echo-profile .echo-identity-panel .left-header-right .projects a {
    border-color: var(--echo-dark-border);
    background: var(--echo-dark-raised);
    box-shadow: none;
    transition:
      border-color 0.18s ease,
      background 0.18s ease,
      box-shadow 0.18s ease,
      transform 0.18s ease;
  }

  &.echo-profile .echo-identity-panel .left-header-right button:hover,
  &.echo-profile .echo-identity-panel .left-header-right .projects a:hover {
    border-color: rgba(0, 221, 115, 0.28);
    background: #182d47;
    box-shadow: none;
  }

  &.echo-profile .echo-identity-panel .left-header-right .projects {
    color: var(--echo-dark-text-muted);
  }

  &.echo-profile .echo-identity-panel .left-header-right .projects a {
    display: inline-flex;
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--echo-dark-border);
    border-radius: 50%;
  }

  &.echo-profile
    .echo-identity-panel
    .left-header-right
    .projects
    a
    svg
    path[fill]:not([fill="none"]) {
    fill: var(--echo-dark-text-muted);
  }

  &.echo-profile
    .echo-identity-panel
    .left-header-right
    .projects
    a
    svg
    path[stroke]:not([stroke="none"]) {
    stroke: var(--echo-dark-text-muted);
  }

  &.echo-profile
    .echo-identity-panel
    .left-header-right
    .projects
    a:hover
    svg
    path[fill]:not([fill="none"]) {
    fill: ${mainGlobalDark.positive};
  }

  &.echo-profile
    .echo-identity-panel
    .left-header-right
    .projects
    a:hover
    svg
    path[stroke]:not([stroke="none"]) {
    stroke: ${mainGlobalDark.positive};
  }

  &.echo-profile .echo-identity-panel .left-header-right #favorite path {
    stroke: var(--echo-dark-text);
  }

  &.echo-profile
    .echo-identity-panel
    .left-header-right
    button
    svg
    path[stroke="#070B35"],
  &.echo-profile
    .echo-identity-panel
    .left-header-right
    button
    svg
    path[stroke="#738094"] {
    stroke: var(--echo-dark-text);
  }

  &.echo-profile
    .echo-identity-panel
    .left-header-right
    button
    svg
    path[fill="#070B35"],
  &.echo-profile
    .echo-identity-panel
    .left-header-right
    button
    svg
    path[fill="#383D38"],
  &.echo-profile
    .echo-identity-panel
    .left-header-right
    button
    svg
    path[fill="#738094"] {
    fill: var(--echo-dark-text);
  }

  &.echo-profile .echo-identity-panel .left-header-right .value-icon {
    border: 1px solid var(--echo-dark-border);
    background: var(--echo-dark-raised);
    color: ${mainGlobalDark.white};
    box-shadow: none;
  }

  &.echo-profile .echo-identity-panel .left-header-right a:focus-visible,
  &.echo-profile .echo-identity-panel .left-header-right button:focus-visible,
  &.echo-profile .echo-meta-panel button:focus-visible,
  &.echo-profile .echo-profile-content button:focus-visible,
  &.echo-profile .echo-profile-content a:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  &.echo-profile .echo-funding-highlight {
    gap: 0;
  }

  &.echo-profile .echo-funding-card {
    padding: 18px;
    border: 1px solid var(--echo-dark-border);
    border-radius: 14px;
    background:
      radial-gradient(
        circle at 100% 0,
        rgba(0, 221, 115, 0.16),
        transparent 42%
      ),
      var(--echo-dark-raised);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.04),
      0 14px 28px rgba(0, 0, 0, 0.2);
  }

  &.echo-profile .echo-funding-title,
  &.echo-profile .echo-funding-value {
    color: var(--color-text-inverse);
  }

  &.echo-profile .echo-funding-title span,
  &.echo-profile .echo-funding-title div {
    border-color: rgba(255, 255, 255, 0.12);
  }

  &.echo-profile .echo-funding-title svg [stroke="#070B35"] {
    stroke: var(--color-text-inverse);
  }

  &.echo-profile .echo-funding-progress p {
    color: rgba(255, 255, 255, 0.68);
  }

  &.echo-profile .echo-funding-progress .description-value,
  &.echo-profile .echo-funding-progress p.bold {
    color: var(--color-text-inverse) !important;
  }

  &.echo-profile .echo-funding-progress > div:first-child {
    background: rgba(255, 255, 255, 0.14);
  }

  &.echo-profile .echo-meta-panel {
    gap: 16px;
    color: var(--echo-dark-text);
  }

  &.echo-profile .echo-metric-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: stretch;
    gap: 10px;
  }

  &.echo-profile .echo-metric-grid > div {
    min-width: 0;
    flex-direction: column-reverse;
    justify-content: flex-end;
    gap: 5px;
    padding: 14px 16px !important;
    border: 1px solid var(--echo-dark-border);
    border-radius: 12px;
    background: var(--echo-dark-raised);
    color: var(--color-text-inverse);
    font-size: 20px;
    line-height: 25px;
    overflow-wrap: anywhere;
  }

  &.echo-profile .echo-metric-grid > div > span {
    color: rgba(255, 255, 255, 0.68);
    font-size: 12px;
    line-height: 16px;
  }

  &.echo-profile .echo-meta-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: stretch;
    gap: 10px;
    margin-top: 0;
  }

  &.echo-profile .echo-meta-list > div {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px;
    border: 1px solid var(--color-border-subtle);
    border-radius: 12px;
    background: var(--color-surface-subtle);
  }

  &.echo-profile .echo-meta-list > div > div,
  &.echo-profile .echo-meta-list > div > div > div {
    max-width: 100%;
  }

  &.echo-profile .echo-meta-list button {
    width: 100%;
    max-width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    text-align: left;
  }

  &.echo-profile .echo-meta-list .echo-smart-trigger {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  &.echo-profile .echo-meta-list > div > div:first-child {
    min-width: 0;
  }

  &.echo-profile .echo-meta-list .echo-meta-value {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
    min-height: 36px;
    padding: 8px 10px;
    overflow: hidden;
  }

  &.echo-profile .echo-meta-list .header-category-main {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
    overflow: hidden;
  }

  &.echo-profile .echo-meta-list .header-category-icon {
    width: 16px;
    height: 16px;
    flex: 0 0 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
  }

  &.echo-profile .echo-meta-list .header-category-icon svg {
    width: 16px;
    height: 16px;
  }

  &.echo-profile .echo-meta-list .header-category-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.echo-profile .echo-meta-list .has-hidden-categories {
    overflow: visible;
  }

  &.echo-profile .echo-meta-list .has-hidden-categories .header-category-main {
    max-width: calc(100% - 36px);
  }

  &.echo-profile .echo-meta-list .hidden-categories-popover {
    position: relative;
    z-index: 24;
    flex: 0 0 auto;
    display: inline-flex;
  }

  &.echo-profile .echo-meta-list .hidden-categories-count {
    width: 26px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--color-primary);
    color: var(--color-text-inverse);
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 1;
    box-shadow: 0 6px 14px rgba(4, 165, 132, 0.18);
  }

  &.echo-profile .echo-meta-list .hidden-categories-dropdown {
    position: absolute;
    top: calc(100% + 9px);
    right: 0;
    z-index: 35;
    min-width: 176px;
    max-width: min(260px, calc(100vw - 32px));
    max-height: 240px;
    padding: 10px;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    background: var(--color-surface);
    box-shadow: var(--shadow-soft);
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

  &.echo-profile
    .echo-meta-list
    .hidden-categories-popover:hover
    .hidden-categories-dropdown,
  &.echo-profile
    .echo-meta-list
    .hidden-categories-popover:focus-within
    .hidden-categories-dropdown {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateY(0);
  }

  &.echo-profile .echo-meta-list .hidden-category-item {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
    color: var(--color-text-primary);
    font-size: 13px;
    font-weight: var(--font-weight-medium);
    line-height: 17px;
    white-space: nowrap;
  }

  &.echo-profile .echo-meta-list .hidden-category-item svg {
    width: 16px;
    height: 16px;
    flex: 0 0 16px;
    color: var(--color-text-muted);
  }

  &.echo-profile .echo-meta-list .hidden-category-item span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &.echo-profile .echo-meta-list .echo-meta-value {
    width: 100%;
    margin-top: 0;
    border-color: var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-primary);
  }

  &.echo-profile .echo-smart-contracts .search-dropdown {
    left: 0;
    right: auto;
    width: min(320px, calc(100vw - 48px));
    max-width: 100%;
    padding: 10px;
    border-color: var(--color-border);
    background: var(--color-surface);
    box-shadow: var(--shadow-soft);
  }

  &.echo-profile .echo-smart-contracts .search-dropdown,
  &.echo-profile .echo-smart-contracts:hover .search-dropdown {
    display: none;
  }

  &.echo-profile .echo-smart-contracts.is-open .search-dropdown,
  &.echo-profile .echo-smart-contracts.is-open:hover .search-dropdown {
    display: flex;
  }

  &.echo-profile .echo-smart-contracts .smart-info span,
  &.echo-profile .echo-smart-contracts .search-dropdown button {
    color: var(--color-text-primary);
  }

  &.echo-profile .echo-smart-contracts .search-dropdown button {
    width: 100%;
  }

  &.echo-profile .echo-smart-contracts .search-dropdown button > div {
    width: 100%;
    margin-top: 0;
    border: 1px solid var(--color-border-subtle);
    background: var(--color-surface);
    color: var(--color-text-secondary);
  }

  &.echo-profile .echo-smart-contracts .smart-wrapper {
    min-width: 0;
    padding: 8px;
    border-radius: 9px;
    background: var(--color-surface-subtle);
  }

  &.echo-profile .echo-market-statistics {
    display: grid;
    grid-template-columns: repeat(7, minmax(132px, 1fr));
    justify-content: initial;
    gap: 0;
    margin-top: 16px;
    padding: 0;
    border: 1px solid var(--color-border-subtle);
    border-radius: 12px;
    background: var(--color-surface);
    box-shadow: var(--main-section-shadow);
    overflow-x: auto;
    scrollbar-width: thin;
  }

  &.echo-profile .echo-market-statistics > p {
    min-width: 0;
    min-height: 76px;
    justify-content: center;
    align-items: center;
    gap: 4px;
    padding: 13px 14px;
    border-right: 1px solid var(--color-border-subtle);
    color: var(--color-text-primary);
    font-size: 15px;
    line-height: 19px;
    text-align: center;
    overflow-wrap: anywhere;
  }

  &.echo-profile .echo-market-statistics > p:last-child {
    border-right: 0;
  }

  &.echo-profile .echo-market-statistics > p span {
    color: var(--color-text-muted);
    font-size: 12px;
    line-height: 15px;
  }

  &.echo-profile .echo-market-statistics > p i {
    font-size: 12px;
    line-height: 15px;
  }

  &.echo-profile .echo-market-statistics > p br {
    display: none;
  }

  &.echo-profile .echo-profile-content {
    gap: 24px !important;
    margin-top: 28px;
  }

  &.echo-profile .echo-left-column {
    gap: 24px;
  }

  &.echo-profile .echo-sidebar-stack {
    gap: 16px;
  }

  &.echo-profile .echo-sidebar-stack h2,
  &.echo-profile .echo-profile-content h2 {
    color: var(--color-text-primary);
    font-size: 20px;
    line-height: 25px;
    letter-spacing: -0.01em;
  }

  &.echo-profile ${BaseCardWrapper}[data-card-variant="main"],
  &.echo-profile ${BaseCardCryptoWrapper}[data-card-variant="main"] {
    min-width: 0;
    border: 1px solid var(--color-border-subtle);
    border-radius: 12px;
    background: var(--color-surface);
    box-shadow: var(--main-section-shadow);
  }

  &.echo-profile ${BaseCardWrapper}[data-card-variant="main"]:hover,
  &.echo-profile ${BaseCardCryptoWrapper}[data-card-variant="main"]:hover {
    border-color: var(--color-border);
    background: var(--color-surface);
    box-shadow: var(--main-section-shadow);
    transform: none;
  }

  &.echo-profile ${BaseCardWrapper}[data-card-variant="main"]:focus-visible,
  &.echo-profile ${BaseCardCryptoWrapper}[data-card-variant="main"]:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  &.echo-profile ${ProjectImages} {
    max-height: 420px;
    overflow: hidden;
    border-radius: 14px;
    background: var(--color-surface-muted);
  }

  &.echo-profile ${ProjectImages} img {
    height: clamp(280px, 34vw, 420px);
    border-radius: 14px;
  }

  &.echo-profile ${Round} {
    overflow: hidden;
  }

  &.echo-profile ${RoundProgressWrapper} {
    left: 20px;
    width: calc(100% - 40px);
  }

  &.echo-profile ${RoundInfoWrapper} {
    gap: 24px;
  }

  &.echo-profile ${FundingLeftColumn} .table {
    gap: 10px;
  }

  &.echo-profile ${FundingLeftColumn} .table-item,
  &.echo-profile ${FundingRightColumn} .table-item,
  &.echo-profile ${InvestorInfo} .investor {
    min-width: 0;
    flex-wrap: wrap;
  }

  &.echo-profile ${FundsRaised} {
    min-width: 0;
    flex-wrap: wrap;
  }

  &.echo-profile ${FundsRaised} span {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  &.echo-profile ${StatisticsInfo} {
    flex-wrap: wrap;
    gap: 12px;
  }

  &.echo-profile ${FundingDate} {
    white-space: normal;
  }

  &.echo-profile ${FundraisingContent} {
    min-width: 0;
    flex-wrap: wrap;
  }

  &.echo-profile ${RoundWrapper} {
    min-width: 0 !important;
  }

  &.echo-profile ${MetricsContentWrapper}, &.echo-profile ${PieContentWrapper} {
    gap: 18px;
    margin: 16px 0;
  }

  &.echo-profile ${TableWrapper} {
    max-width: 100%;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    -webkit-overflow-scrolling: touch;
  }

  &.echo-profile ${FundingRoundsWrapper} {
    gap: 12px;
  }

  &.echo-profile ${FundingRoundsWrapper} > ${FundraisingTitle} {
    margin-bottom: 0;
  }

  &.echo-profile ${FundingRoundsWrapper} > ${DataQualityNotice} {
    margin: 0 0 4px;
  }

  &.echo-profile .echo-sidebar-section-header {
    margin-top: 8px !important;
  }

  &.echo-profile
    .echo-sidebar-stack
    > .echo-sidebar-section-header:first-child {
    margin-top: 0 !important;
  }

  &.echo-profile .echo-actions-popover {
    border-color: var(--color-border);
    background: var(--color-surface);
    box-shadow: var(--shadow-soft);
  }

  @media (max-width: 1024px) {
    &.echo-profile .echo-hero {
      grid-template-columns: 1fr;
      gap: 14px;
      padding: 0;
    }

    &.echo-profile .echo-identity-panel,
    &.echo-profile .echo-meta-panel {
      width: 100%;
      padding: 20px;
    }

    &.echo-profile .echo-profile-content {
      gap: 20px !important;
      margin-top: 24px;
    }
  }

  @media (max-width: 768px) {
    &.echo-profile .echo-page-header {
      min-height: 0;
      margin-bottom: 8px;
    }

    &.echo-profile .echo-hero {
      gap: 12px;
      margin-top: 0;
      padding: 0;
    }

    &.echo-profile .echo-identity-panel,
    &.echo-profile .echo-meta-panel {
      gap: 16px;
      padding: 16px;
      border-radius: 14px;
    }

    &.echo-profile .echo-identity-row {
      gap: 12px;
    }

    &.echo-profile .echo-project-title {
      font-size: 24px;
      line-height: 29px;
    }

    &.echo-profile .echo-identity-panel .left-header-bottom {
      position: relative;
      width: 100%;
      display: flex;
      flex-direction: row;
      gap: 8px;
      margin-top: 10px;
    }

    &.echo-profile .echo-popover-trigger {
      position: static;
      width: 38px;
      height: 38px;
      border: 1px solid var(--echo-dark-border);
      background: var(--echo-dark-raised);
      color: ${mainGlobalDark.positive};
      box-shadow: none;
    }

    &.echo-profile .echo-popover-trigger:hover {
      border-color: rgba(0, 221, 115, 0.28);
      background: #182d47;
    }

    &.echo-profile .echo-actions-popover {
      position: fixed;
      top: auto;
      right: 12px;
      bottom: 12px;
      left: 12px;
      z-index: 50;
      width: auto;
      max-height: min(70vh, 520px);
      padding: 12px;
      border-radius: 16px;
      overflow-y: auto;
    }

    &.echo-profile .echo-metric-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    &.echo-profile .echo-metric-grid > div {
      padding: 11px 10px;
      font-size: 18px;
      line-height: 22px;
    }

    &.echo-profile .echo-profile-content {
      gap: 16px !important;
      margin-top: 16px;
    }

    &.echo-profile .echo-sidebar-stack h2,
    &.echo-profile .echo-profile-content h2 {
      font-size: 18px;
      line-height: 23px;
    }

    &.echo-profile ${ProjectImages} {
      max-height: none;
    }

    &.echo-profile ${ProjectImages} img {
      height: clamp(220px, 62vw, 340px);
    }

    &.echo-profile ${RoundProgressWrapper} {
      left: 16px;
      width: calc(100% - 32px);
    }

    &.echo-profile ${StatisticsInfo} {
      justify-content: flex-start;
    }

    &.echo-profile
      ${MetricsContentWrapper},
      &.echo-profile
      ${PieContentWrapper} {
      gap: 14px;
      margin: 14px 0;
    }
  }

  @media (max-width: 560px) {
    &.echo-profile .echo-metric-grid,
    &.echo-profile .echo-meta-list {
      grid-template-columns: 1fr;
    }

    &.echo-profile .echo-metric-grid > div {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      column-gap: 12px;
    }

    &.echo-profile .echo-metric-grid > div > span {
      grid-column: 1;
      grid-row: 1;
    }

    &.echo-profile .echo-funding-card {
      padding: 14px;
      border-radius: 12px;
    }

    &.echo-profile .echo-identity-row .echo-project-avatar,
    &.echo-profile .echo-identity-row .echo-project-avatar > img {
      width: 52px;
      height: 52px;
    }

    &.echo-profile .echo-identity-row .echo-project-avatar {
      flex-basis: 52px;
    }

    &.echo-profile .echo-funding-progress > div:last-child {
      gap: 8px;
      flex-wrap: wrap;
    }

    &.echo-profile .echo-funding-progress > div:last-child p {
      flex: 1 1 auto;
      font-size: 12px;
      line-height: 16px;
    }

    &.echo-profile ${FundingLeftColumn} .header {
      flex-wrap: wrap;
    }

    &.echo-profile
      ${FundsRaised},
      &.echo-profile
      ${InvestorInfo},
      &.echo-profile
      ${FundingRightColumn}
      .table-item {
      justify-content: flex-start;
      margin-left: 0;
      text-align: left;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &.echo-profile *,
    &.echo-profile *::before,
    &.echo-profile *::after {
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
    }
  }
`;
