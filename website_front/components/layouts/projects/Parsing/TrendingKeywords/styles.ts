import styled from "styled-components";

export const Wrapper = styled.div`
  width: 100%;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  flex-wrap: wrap;

  & .title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    position: relative;
  }

  & .description {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    color: var(--main-gray);
  }
`;

export const Items = styled.div`
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;

  & .item {
    background: #e9f8f8;
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    color: var(--main-green);
  }

  @media (max-width: 768px) {
    gap: 12px;
  }
`;

export const DescriptionWrapper = styled.div`
  & .description-component {
    width: 120px;
    padding: 10px 20px;
    z-index: 1;
    background: white;
    position: absolute;
    top: 25px;
    right: -35px;
    div {
      font-size: 14px;
      color: var(--main-gray);
      text-align: center;
    }
  }
`;
