import styled from "styled-components";

export const Wrapper = styled.div`
  margin: 20px auto 0;
  padding: 0 4px;

  @media (max-width: 768px) {
    margin-top: 16px;
  }

  @media (max-width: 480px) {
    margin-top: 12px;
    padding: 0;
  }

  & .title {
    margin: 40px 0 20px;
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 29.4px;

    @media (max-width: 768px) {
      margin: 30px 0 16px;
      font-size: 22px;
      line-height: 26px;
    }

    @media (max-width: 480px) {
      margin: 24px 0 12px;
      font-size: 20px;
      line-height: 24px;
    }
  }
`;

export const List = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;

  @media (max-width: 768px) {
    gap: 16px;
  }

  @media (max-width: 480px) {
    gap: 12px;
  }
`;
