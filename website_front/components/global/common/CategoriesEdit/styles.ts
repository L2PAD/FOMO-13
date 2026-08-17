import styled from "styled-components";

export const Wrapper = styled.div`
  width: 100%;

  & .add-link {
    width: 120px;
    font-weight: var(--font-weight-regular);
    font-size: 12px;
    border-radius: 4px;

    &:hover {
      background: white;
      color: var(--main-green);
    }
  }
`;

export const Inputs = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;

  & .input-width {
    width: 100%;
  }

  input {
    width: 100%;
  }

  margin-bottom: 12px;
`;

export const InputLabel = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
`;

export const LinksWrapper = styled.div`
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  div {
    display: flex;
    align-items: center;
    gap: 4px;

    img {
      width: 20px;
      height: 20px;
      border-radius: 50%;
    }

    span {
      font-size: 14px;
      color: var(--color-text-muted);
    }
  }

  & .remove-btn {
    display: flex;
    margin-left: 4px;
    svg {
      width: 12px;
      height: 12px;
    }
  }
`;
