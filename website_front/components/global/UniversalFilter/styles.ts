import styled from "styled-components";

export const SectionWrapper = styled.div`
  margin-top: 20px;
  padding: 20px;
  background: #f5fbfd;
  display: flex;
  flex-direction: column;
  gap: 20px;

  & .status-items .categories {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  &.price-block {
    & .categories.id0 {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 12px;
      margin-bottom: 20px;
    }
  }

  & .range-categories {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &.bottom-block {
    .categories.id0 {
      display: flex;
      flex-direction: column;
    }
    .categories.id1 {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
  }

  &.middle-block {
    .categories.id0 {
      display: flex;
      flex-direction: column;
    }
    .categories.id1 {
      display: flex;
      flex-direction: column;
    }
    .categories.id2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
  }

  &.column-checkboxes {
    & .categories {
      display: flex;
      flex-direction: column;
    }
  }
  & .fomo-score .categories {
    display: grid !important;
    grid-template-columns: 1fr 1fr;
  }
  h4 {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 20px;
    margin-bottom: 10px;
  }

  input {
    font-size: 14px;
    background: var(--color-white);
    &::placeholder {
      font-size: 14px;
    }
  }

  svg {
    top: 8px;
  }

  & .rankWrapper {
    & .categories {
      grid-template-columns: 1fr 1fr;
    }
  }

  & .followersWrapper {
    & .categories {
      grid-template-columns: 0.69fr 1fr;
    }
  }
`;

export const SearchWrapper = styled.div`
  display: flex;
  gap: 5%;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

export const Categories = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 0.4fr;
  gap: 12px;
  overflow-x: auto;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  p {
    font-weight: var(--font-weight-regular);
    font-size: 12px;
  }
`;

export const PriceCheckboxes = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  margin-bottom: 20px;
  p {
    font-weight: var(--font-weight-regular);
    font-size: 12px;
  }
`;

export const Checkboxes = styled.div`
  margin-bottom: 20px;
`;

export const CheckboxBigWrapper = styled.div`
  margin-top: 20px;

  display: flex;
  flex-direction: column;
  gap: 20px;

  p {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
`;

export const Actions = styled.div`
  margin: 20px 0px;
  display: flex;
  gap: 20px;
  width: 100%;
  button {
    border-radius: 8px;
    max-width: 100%;
    width: 50%;
    &:last-child {
      background: var(--color-primary) !important;

      &:hover {
        background: #39816a !important;
      }

      &:active {
        background: #2e6a58 !important;
      }
    }
  }
`;

export const ResetButton = styled.div`
  max-width: fit-content;
  margin: 20px auto 0;

  button {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--color-text-muted);
    font-size: 12px;

    &:hover {
      opacity: 0.8;
    }
  }
`;

export const SearchInputWrapper = styled.div``;
