import styled from "styled-components";

export const CardWrapper = styled.div`
  max-width: 440px;
  width: 100%;
  padding: 16px;
  box-shadow: 0px 1px 1px 0px #00000040;
  border: 2px solid #f5f9fd;
  border-radius: 16px;
`;

export const CardHead = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const CardHeadLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  & div {
    font-family: "Gilroy";
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: #0d0f2b;
  }
  & span {
    font-family: "Gilroy";
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
  }
`;

export const CardHeadRight = styled.div`
  display: flex;
  gap: 5px;
  font-size: 15px;
  & span {
    font-family: "Gilroy";
    font-size: 15px;
    font-weight: var(--font-weight-semibold);
    color: #0d0f2b;
  }
`;

export const CardValue = styled.div`
  margin: 6px 0px 12px 0px;
  font-family: "Gilroy";
  font-size: 32px;
  font-weight: var(--font-weight-semibold);
  line-height: 39.62px;
  text-align: center;

  & div {
    font-family: "Gilroy";
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    line-height: 16.98px;
    text-align: center;
    color: var(--color-text-muted);
    margin-bottom: 6px;
  }

  & input {
    font-family: "Gilroy";
    font-size: 32px;
    font-weight: var(--font-weight-semibold);
    line-height: 16.98px;
    text-align: center;
    border: none;
  }
  &.rewardCard {
    margin-top: 17px;
    margin-bottom: 24px;
  }
`;

export const AvailableValue = styled.div`
  margin-top: 3px;
  font-family: "Gilroy";
  font-size: 14px;
  font-weight: var(--font-weight-regular);

  span {
    color: black;
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
  }
`;
