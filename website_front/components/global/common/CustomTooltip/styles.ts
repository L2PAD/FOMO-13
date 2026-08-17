import styled from "styled-components";

export const BlocksWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (max-width: 768px) {
    max-width: 210px;
  }
`;

export const Wrapper = styled.div`
  box-shadow: 0px 1px 4px 0px #0c0c0d0d;
  border-radius: 12px;
  padding: 10px 20px;
  background: "rgba(255, 255, 255, 0.4)";
  backdrop-filter: blur(35px);

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    .value {
      font-size: 10px;
      line-height: 1;
      width: min-content;

      & > div {
        display: flex;
        flex-direction: row;
      }
    }
  }
`;

export const Title = styled.div`
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  line-height: 12px;
  color: var(--color-text-primary);

  @media (max-width: 768px) {
    font-size: 10px;
    line-height: 1;
  }
`;

export const Items = styled.div`
  margin-top: 10px;

  & .item {
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  & .key {
    font-size: 12px;
    font-weight: var(--font-weight-regular);
    line-height: 12px;
    color: var(--color-text-primary);

    @media (max-width: 768px) {
      font-size: 10px;
      line-height: 1;
    }
  }
`;
