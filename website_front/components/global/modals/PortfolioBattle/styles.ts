import styled from "styled-components";

export const Wrapper = styled.div``;

export const Body = styled.div`
  margin: 40px 0px;

  font-weight: var(--font-weight-regular);
  font-size: 16px;
  line-height: 19.2px;

  span {
    font-weight: var(--font-weight-semibold);
  }

  &.small-delete-modal {
    margin: 0px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    text-align: center;
    h3 {
      font-weight: var(--font-weight-semibold);
      font-size: 16px;
    }
    p {
      font-size: 14px;
    }
  }
`;

export const Buttons = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;

  button {
    width: 50%;
  }

  & button:nth-child(1) {
    background: #f9f9f9;
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    padding: 8px 12px;
    border-radius: 8px;
  }
`;

export const SmallButtons = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  button {
    width: 100%;
    font-size: 16px;
  }
`;

export const IconWrapper = styled.div`
  max-width: fit-content;
  margin: 0px auto 10px;
`;
