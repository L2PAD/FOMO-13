import styled from "styled-components";

export const AllocFilterWrapper = styled.div`
  position: relative;

  .modal-style {
    width: 100% !important;
    max-width: 820px !important;
  }
  &.influence-filter {
    .header-wrapper {
      margin-bottom: 40px;
    }
    .checkboxes {
      max-width: none;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      margin-top: 8px;
    }
    .input-range {
      background: transparent;
      max-width: 80px;
      padding: 0px;

      &.left {
        text-align: left;
      }
      &.right {
        text-align: right;
      }
    }
    .column {
      width: 100%;
      margin-top: 0px;
      display: flex;
      flex-direction: column;
      .checkboxes {
        display: grid;
        grid-template-columns: 1fr 1fr;
        margin-top: 0px;

        &.redFlags {
          grid-template-columns: 1fr 1fr 1fr;
        }
      }
    }
    .row {
      padding: 20px;
      background: #f5fbfd;
      border-radius: 12px;
      gap: 10px;
    }
  }

  &.ad-mode-filter {
    .filter-modal .modal-style {
      max-width: 820px !important;
    }
    .header-wrapper {
      margin-bottom: 40px;
    }
    .checkboxes {
      max-width: none;
      display: grid;
      grid-template-columns: 1fr 1fr;
      margin-top: 8px;
      gap: 12px;

      &.cpmType {
        grid-template-columns: 1fr 1fr 1fr;
      }
      &.predictability,
      &.cpmEfficiency,
      &.timeToReach,
      &.promoSaturation,
      &.riskLevel {
        grid-template-columns: 1fr 1fr 1fr;

        @media (max-width: 768px) {
          grid-template-columns: 1fr 1fr;
        }
      }
      &.audienceFit,
      &.productType {
        grid-template-columns: 1fr 1fr;
      }
    }
    .input-range {
      background: transparent;
      max-width: 80px;
      padding: 0px;

      &.left {
        text-align: left;
      }
      &.right {
        text-align: right;
      }
    }
    .row {
      padding: 20px;
      background: #f5fbfd;
      border-radius: 12px;
      gap: 10px;

      &:not(:last-child) {
        margin-bottom: 20px;
      }

      &.cpm,
      &.campaignBudget,
      &.realViews,
      &.fomoScore {
        background: transparent;
        padding: 0;
        padding-bottom: 20px;
        width: 100%;
        margin-bottom: 0px;
      }

      &.predictability,
      &.cpmEfficiency,
      &.timeToReach,
      &.promoSaturation,
      &.riskLevel,
      &.audienceFit,
      &.productType,
      &.promoFormat {
        width: calc(100% / 2 - 10px);
        margin-bottom: 0px;

        @media (max-width: 768px) {
          width: 100%;
        }
      }
    }
  }

  .orders-filter,
  &.influence-filter,
  &.ad-mode-filter {
    .modal-style {
      width: 100% !important;
      max-width: 480px !important;

      .row {
        gap: 8px;
      }

      .internal-wrapper {
        padding: 40px;

        @media (max-width: 600px) {
          padding: 20px;
        }
      }
    }
  }

  &.influence-filter,
  &.ad-mode-filter {
    .modal-style .row {
      gap: 12px;
    }
  }
  .content {
    display: flex;
    flex-direction: column;
    gap: 20px;

    .alloc-checkbox label {
      font-size: 12px;
    }

    .radio-checkmark {
      width: 16px;
      height: 16px;
    }
  }
`;

export const AllocDropdown = styled.div<{ active: boolean; right?: boolean }>`
  display: flex !important;
  flex-direction: column;
  gap: 80px;
  left: ${({ right }) => (right ? "-140px" : 0)};
  display: ${({ active }) => (active ? "block" : "none")};
  & .Alloc-checkbox.checkboxes {
    max-width: 300px;
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
`;

export const AllocDropdownWrapper = styled.div`
  background: white;
  border-radius: 8px;
  width: 100%;
  display: grid;
  gap: 20px;

  .radio-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  &.default-filters {
    padding: 20px;
    display: flex;
    flex-direction: column;
    background: #f5fbfd;
    border-radius: 12px;
    gap: 40px;
  }

  .market-radios {
    display: flex;
    flex-direction: row;
    gap: 40px;
    justify-content: space-between;
    flex-wrap: wrap;
  }
  &:not(.default-filters) {
    .row {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 40px;
      background: #f5fbfd;
      border-radius: 12px;
    }
    .date {
      background: transparent;
      gap: 8px;
      padding: 0px;
    }
  }
`;

export const DropdownRow = styled.div`
  display: flex;
  flex-direction: column;
  grid-template-columns: 1fr 1fr;
  grid-gap: 10px;
  gap: 10px;

  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .checkboxes {
    display: flex;
    flex-direction: column;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 10px;
    gap: 12px;

    &.fundingStage,
    &.availableSpots {
      grid-template-columns: 1fr 1fr;
      width: 66%;
    }
    &.grid {
      display: grid;
    }
    &.grid-2 {
      grid-template-columns: 1fr 1fr;
    }
    &.market-type {
      grid-template-columns: 1fr;
    }
    &.flex {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }

    @media (max-width: 600px) {
      grid-template-columns: 1fr 1fr;
    }

    @media (max-width: 450px) {
      grid-template-columns: 1fr;
    }
  }
`;

export const Buttons = styled.div`
  max-width: 390px;
  width: 100%;
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 40px;

  button {
    width: 50% !important;
    border-radius: 8px !important;
  }

  .red-btn {
    background: #f9f9f9;
    color: var(--color-danger);
    font-size: 16px;
  }
`;

export const ResetWrapper = styled.div`
  max-width: fit-content;
  margin-top: 20px;

  button {
    font-size: 12px;
    width: 100%;
    padding: 0px 10px;
    color: #728094;

    &:hover {
      background: var(--input-hover);
      color: var(--color-text-muted);
    }
    &:active {
      background: var(--input-active);
      color: var(--color-text-muted);
    }
  }
`;

export const AllocColumn = styled.div`
  width: 100%;
  margin-top: 50px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
`;

export const AllocBottom = styled.div`
  margin-top: 10px;
  display: flex;
  grid-template-columns: 1fr 0.05fr;
  flex-direction: column;
  width: 100%;
  gap: 0px;
  align-items: center;

  div {
    width: 100%;
    max-width: 100%;
  }

  button {
    width: 100%;
  }
`;
