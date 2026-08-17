import styled from "styled-components";

export const BodyWrapper = styled.div``;

export const HeaderWrapper = styled.div`
  margin-top: 40px;
  display: flex;
  gap: 12px;

  input {
    width: 80%;
    border: 1px solid #e5e5e5;
    background: white;
    border-radius: 8px;
    padding: 8px;

    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16.8px;
  }
  button {
    width: 20%;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;

    input {
      width: 100%;
    }

    button {
      width: 100%;
    }
  }
`;

export const FakeImg = styled.img`
  margin: 20px 0;
  max-width: 720px;
  width: 100%;
  height: auto;
`;

export const BottomWrapper = styled.div`
  display: flex;
  align-items: center;

  & .share-label {
    font-weight: var(--font-weight-regular);
    font-size: 22px;
    line-height: 18.4px;
    margin-right: 20px;
    margin-bottom: 4px;
  }

  & #link path {
    fill: black;
  }

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 12px;
  }
`;

export const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--color-primary);
  font-size: 16px;
  padding: 10px;
  width: 160px;
  font-weight: var(--font-weight-semibold);
  line-height: 19.6px;
  color: var(--color-primary);
  margin-left: auto;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    width: 100%;
    order: -1;
  }

  path {
    transition: all 0.3s ease;
  }

  &:hover {
    border: 1px solid #39816a;
    color: #39816a;
    path {
      stroke: #39816a;
    }
  }

  &:active {
    border: 1px solid #2e6a58;
    color: #2e6a58;

    path {
      stroke: #2e6a58;
    }
  }
`;
