import styled from "styled-components";

export const Wrapper = styled.div``;

export const Header = styled.div`
  margin: 20px 0 40px;
  font-weight: var(--font-weight-regular);
  font-size: 16px;
`;

export const Steps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
  margin-bottom: 40px;
`;

export const Step = styled.button`
  padding: 20px;
  border-radius: 8px;
  box-shadow: 2px 2px 8px 2px #00053014;
  transition: all 0.3s ease;

  div {
    text-align: left;
  }

  &:hover {
    box-shadow: 2px 3px 12px 6px #00053014;
  }

  &:active {
    box-shadow: 2px 2px 8px 2px #00053014;
  }
`;

export const StepHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 29.4px;
  }
`;

export const StepDescription = styled.div`
  margin-top: 20px;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16.8px;
  color: var(--main-gray);
`;

export const ButtonsWrapper = styled.div`
  margin-left: auto;
  max-width: 170px;

  button {
    max-width: 170px;
    width: 100%;
  }
`;
