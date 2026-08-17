import styled from "styled-components";

export const BlueLinear = styled.button`
  max-width: 400px;
  width: 100%;
  padding: 15px 10px;
  border-radius: 20px;
  background: linear-gradient(
    0deg,
    rgba(29, 147, 216, 0.6) 26.373%,
    rgba(17, 105, 157, 0.31) 62.793%,
    rgba(4, 59, 91, 0.2) 97.479%
  );
  color: rgb(255, 255, 255);
  font-family: "Roboto";
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  line-height: 28px;
  letter-spacing: 0%;
  text-align: center;
  border: 1px solid #01c2ff;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(29, 147, 216, 0.7);
  }
  &:active {
    background: rgba(11, 97, 146, 0.95);
  }
  &:disabled {
    background: rgb(5, 70, 107);
    cursor: not-allowed;
  }
`;

export const MainButtonStyles = styled.button`
  font-family: "Gilroy";
  font-size: 20px;
  font-weight: var(--font-weight-regular);
  line-height: 1.12;
  text-align: center;
  background: var(--color-white)33;
  padding: 16px 4px;
  color: white;
  border-radius: 8px;
  max-width: 280px;
  width: 100%;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #b9b9b962;
  }
  &:active {
    background: #504f4f9e;
  }
  &:disabled {
  }

  @media (max-width: 450px) {
    max-height: 50px;
  }
`;

export const MainOrangeBtn = styled.button`
  font-family: "Gilroy";
  font-size: 20px;
  font-weight: var(--font-weight-regular);
  line-height: 1.12;
  text-align: center;
  background: linear-gradient(46.88deg, #fe4935 3.02%, #ff7b3b 100%);
  border: 2px solid var(--color-white)21;
  padding: 16px 4px;
  color: white;
  border-radius: 8px;
  max-width: 280px;
  width: 100%;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(46.88deg, #ef3420 3.02%, #e86c2f 100%);
  }
  &:active {
    background: linear-gradient(46.88deg, #db2d1a 3.02%, #ca5a21 100%);
  }
  &:disabled {
  }

  @media (max-width: 450px) {
    max-height: 50px;
    line-height: 50%;
  }
`;
