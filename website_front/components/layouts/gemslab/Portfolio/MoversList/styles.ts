import styled from "styled-components";
import BaseCard from "../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)<{ $core?: boolean }>`
  width: 100%;
  height: 100%;
  ${({ $core }) =>
    $core &&
    `
      border: 1px solid #f0f2f5;
      border-radius: 14px;
      box-shadow: rgba(0, 5, 48, 0.06) 2px 2px 8px;
    `}
`;

export const Title = styled.div<{ $core?: boolean }>`
  font-weight: var(--font-weight-semibold);
  font-size: ${({ $core }) => ($core ? "15px" : "14px")};
  line-height: ${({ $core }) => ($core ? "19px" : "100%")};
  letter-spacing: 0%;
  color: var(--main-gray);
  padding: ${({ $core }) => ($core ? "2px 2px 14px" : "6.5px 10px")};
  margin-bottom: ${({ $core }) => ($core ? "0" : "4px")};
  color: ${({ $core }) => ($core ? "var(--color-text-primary)" : "var(--main-gray)")};
`;

export const List = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Item = styled.div<{ $core?: boolean }>`
  border-top: 1px solid #f0f2f5;
  padding: ${({ $core }) => ($core ? "12px 2px" : "10px")};
  display: grid;
  grid-template-columns: 1fr 1fr;

  @media (max-width: 520px) {
    grid-template-columns: 1fr 0.8fr;
    padding: 8px;
    font-size: 12px;
  }
`;

export const Values = styled.div`
  div {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;
    margin-bottom: 4px;
  }

  span {
    font-weight: var(--font-weight-regular);
    font-size: 10px;
    line-height: 100%;
  }

  @media (max-width: 520px) {
    div {
      font-size: 12px;
    }
    span {
      font-size: 9px;
    }
  }
`;
