import styled from "styled-components";
import BaseCard from "../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  width: 100%;
`;

export const Body = styled.div`
  display: flex;
  gap: 20px;
  @media (max-width: 1100px) {
    flex-direction: column;
  }
`;

export const ChartWrapperBody = styled(BaseCard)`
  width: 65%;
  @media (max-width: 1100px) {
    width: 100%;
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
  h2 {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 100%;
    letter-spacing: 0%;
    margin: 0px;
  }
  @media (max-width: 600px) {
    h2 {
      font-size: 20px;
    }
  }
`;
