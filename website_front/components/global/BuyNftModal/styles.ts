import styled from "styled-components";

export const ModalWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 10000;
  background: #00000099;
  cursor: pointer;
`;

export const ModalBackground = styled.div`
  position: relative;
  z-index: 100000;
  cursor: default;

  & img {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 0;

    @media (max-width: 885px) {
      display: none;
    }
  }
`;

export const ModalBody = styled.div`
  position: relative;
  width: 850px;
  height: 445px;
  padding: 50px 75px 45px;
  @media (max-width: 885px) {
    max-width: 90vw;
    height: auto;
    width: 100%;
    padding: 30px;
    background: #000000b8;
    border-radius: 18px;
    border: 2px solid #9a1d31;
    text-align: center;
  }
`;

export const Title = styled.div`
  font-family: "Gilroy";
  font-size: 32px;
  font-weight: var(--font-weight-semibold);
  line-height: 40.38px;
  text-align: center;
  color: white;
  margin-bottom: 20px;
`;

export const Description = styled.div`
  max-width: 614px;
  font-family: "Gilroy";
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  text-align: left;
  color: white;
`;

export const InputsRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  margin-left: 2px;

  @media (max-width: 620px) {
    flex-direction: column;
    justify-content: center;
    gap: 10px;
  }
`;

export const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  & label {
    font-family: "Gilroy";
    font-size: 16px;
    font-weight: var(--font-weight-regular);
    line-height: 24px;
    color: white;
    font-weight: var(--font-weight-medium);
    text-shadow:
      -0.5px -0.5px 0 #ff6239,
      0.5px -0.5px 0 #ff6239,
      -0.5px 0.5px 0 #ff6239,
      0.5px 0.5px 0 #ff6239;
  }
  & input {
    width: 100%;
    height: 46px;
    background: transparent;
    border: none;
    color: white;
    font-family: "Gilroy";
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    padding-left: 18px;
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
    }
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
    }
    text-shadow:
      -1px -1px 0 #ff6239,
      1px -1px 0 #ff6239,
      -1px 1px 0 #ff6239,
      1px 1px 0 #ff6239;

    @media (max-width: 885px) {
      width: 100%;
      box-shadow: 0px 0px 0.5px 0.5px #ff6239;
      border-radius: 4px;
    }
  }
  & span {
    transform: translateY(6px);
    width: 100%;
    height: 46px;
    background: transparent;
    border: none;
    color: white;
    font-family: "Gilroy";
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    padding-left: 18px;
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
    }
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
    }
    text-shadow:
      -1px -1px 0 #ff6239,
      1px -1px 0 #ff6239,
      -1px 1px 0 #ff6239,
      1px 1px 0 #ff6239;
    @media (max-width: 885px) {
      transform: translateY(0px);
      box-shadow: 0px 0px 0.5px 0.5px #ff6239;
      border-radius: 4px;
      line-height: 180%;
    }
  }

  @media (max-width: 768px) {
    align-items: center;
  }
`;

export const ButtonWrapper = styled.button`
  width: 400px;
  height: 55px;
  margin-top: 31px;
  background: transparent;
  border: none;
  color: white;
  font-family: "Gilroy";
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  transition: all 0.3s ease;
  border-radius: 18px;

  &:hover {
    background: #fe64395f;
  }
  &:active {
    background: #fe6439d3;
  }
  @media (max-width: 885px) {
    width: 240px;
    background: linear-gradient(
      0.99deg,
      rgba(255, 179, 63, 0.29) 26.42%,
      rgba(239, 116, 47, 0.05) 81.11%
    );
    border: 1px solid #fe6439d3;
  }
`;
