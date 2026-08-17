import styled from "styled-components";
import BaseCard from "../../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;
`;

export const List = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  row-gap: 30px;
  column-gap: 20px;

  @media (max-width: 575px) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px 12px;
  }
`;

export const Card = styled.a`
  width: 112px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  img {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
  }

  div {
    text-align: center;
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    line-height: 19.6px;
  }

  @media (max-width: 575px) {
    width: 100%;
    gap: 10px;

    img {
      width: 52px;
      height: 52px;
    }

    div {
      font-size: 14px;
      line-height: 18px;
    }
  }
`;

export const LogoWrapper = styled.div`
  position: relative;
  margin-top: 20px;

  & > p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--main-black);
    margin-bottom: 12px;
  }

  & > div {
    display: flex;
    gap: 12px;
  }

  button {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-primary);
    border: none;
    background: none;
  }
`;

export const LogoFakeImage = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 8px;
  background: #f8f8f9;
`;

export const LogoImage = styled.img`
  min-width: 64px;
  min-height: 64px;
  max-width: 64px;
  max-height: 64px;
  border-radius: 8px;
  object-fit: contain;
`;

export const LogoInputLabel = styled.label`
  cursor: pointer;
  font-family: Gilroy, "sans-serif";
  font-size: 14px;
  line-height: 17px;
`;

export const LogoInput = styled.input`
  opacity: 0;
  position: absolute;
  left: 0;
  top: 0;
  width: 64px;
  height: 64px;
  cursor: pointer;
`;

export const CardEdit = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  & .remove-btn {
    position: absolute;
    top: 5px;
    right: -5px;
    svg {
      width: 14px;
    }
  }
`;
export const NameInput = styled.input`
  max-width: 120px;
  padding: 8px;
  border-radius: 8px;
  border: none;
`;
