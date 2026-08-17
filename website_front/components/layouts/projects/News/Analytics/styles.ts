import styled from "styled-components";

export const Wrapper = styled.div`
  margin: 40px 0;

  h2 {
    font-weight: var(--font-weight-semibold);
  }
`;

export const Body = styled.div``;

export const BigItem = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 20px 0;
  padding: 20px 40px;
  width: 100%;
  height: 240px;
  background: #c2c2c2;
  border-radius: 12px;

  div {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    font-size: 18px;
    margin-bottom: 27px;
  }

  p {
    color: var(--color-text-muted);
    font-size: 14px;
  }
`;

export const ItemDescription = styled.div``;

export const DefaultItems = styled.div`
  display: flex;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
`;

export const Item = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20px 40px;
  width: 32.6%;
  height: 240px;
  background: #c2c2c2;
  border-radius: 12px;

  div {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    font-size: 18px;
    margin-bottom: 27px;
  }

  p {
    color: var(--color-text-primary);
    font-size: 16px;
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 16px 20px;
    height: auto;

    div {
      font-size: 16px;
      margin-bottom: 16px;
    }

    p {
      font-size: 14px;
    }
  }
`;

export const UpdateInfo = styled.div`
  margin-top: 20px;
  color: var(--color-text-muted);
`;
