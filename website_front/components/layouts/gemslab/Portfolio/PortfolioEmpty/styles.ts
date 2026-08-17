import styled from "styled-components";
import BaseCard from "../../../../global/common/BaseCard";

export const Wrapper = styled.div<{ $core?: boolean }>`
  width: 100%;
  padding: ${({ $core }) => ($core ? "44px 20px" : "0")};
  border: ${({ $core }) => ($core ? "1px solid #f0f2f5" : "0")};
  border-radius: ${({ $core }) => ($core ? "16px" : "0")};
  background: ${({ $core }) => ($core ? "var(--color-white)" : "transparent")};
  box-shadow: ${({ $core }) =>
    $core ? "rgba(0, 5, 48, 0.05) 2px 2px 8px" : "none"};
`;

export const Body = styled.div<{ $core?: boolean }>`
  display: flex;
  gap: 20px;
  justify-content: ${({ $core }) => ($core ? "center" : "initial")};
  @media (max-width: 1100px) {
    flex-direction: column;
  }
`;

export const EmptySectionWrapper = styled.div<{ $core?: boolean }>`
  width: ${({ $core }) => ($core ? "min(100%, 640px)" : "65%")};
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
  h2 {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 100%;
    letter-spacing: 0%;
    margin: 0px;
  }
`;
