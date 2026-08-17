import styled from "styled-components";

export const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

export const BackButton = styled.div`
  position: absolute;
  top: 55px;
  left: 25px;

  @media (max-width:1080px) {
    top: unset;
    bottom: -155px;
    left: 50%;
    transform: translateX(-50%);
  }
    @media (max-width:520px) {
    bottom: -145px;
  }
`

export const Title = styled.div`
  margin-top: 30px;

  text-shadow: 0 0 12px rgb(255, 0, 0);
  justify-content: center;
  align-items: center;
  display: flex;

  a {
    color: rgb(255, 255, 255);
    font-size: 96px;
    font-weight: var(--font-weight-regular);
    line-height: 120px;
    letter-spacing: 45px;
    text-align: center;
  }
`;

export const Wrapper = styled.div`
position: relative;
  height: 100%;
  overflow-x: hidden;

  p {
    color: rgb(255, 255, 255);
    font-family: "Roboto";
    font-size: 24px;
    font-weight: var(--font-weight-medium);
    line-height: 28px;
    letter-spacing: 0%;
    text-align: center;
  }
    @media (max-width:1080px) {
      padding-bottom: 150px;
  }
  @media (max-width: 710px) {
    h1 {
      transform: translateX(14px);
      font-size: 76px;
      font-weight: var(--font-weight-regular);
      line-height: 100px;
      letter-spacing: 35px;
    }
    p {
      font-size: 18px;
      line-height: 20px;
    }
  }
  @media (max-width: 440px) {
    padding: 0px 24px 36px;

    a {
      width: 100%;

      svg {
        width: 100%;
      }
    }
  }
`;

export const ImageWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  img {
    max-width: 100%;
    width: 100vw;
    height: 100%;
    object-fit: cover;
  }
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.4);
    pointer-events: none;
  }
`;

export const CodeWrapper = styled.div`
  max-width: 660px;
  margin: 34px auto;
  display: flex;
  align-items: center;
  gap: 40px;
  @media (max-width: 710px) {
    gap: 14px;
  }
`;

export const CodeInput = styled.input`
  position: relative;
  min-width: 100px;
  max-width: 100px;
  min-height: 100px;
  max-height: 100px;
  box-sizing: border-box;
  border-radius: 12px;
  background: rgba(10, 125, 190, 0.6);
  color: rgb(255, 255, 255);
  font-family: "Roboto";
  font-size: 56px;
  font-weight: var(--font-weight-semibold);
  line-height: 66px;
  letter-spacing: 0%;
  text-align: center;
  border: 1px solid #01c2ff;

  @media (max-width: 710px) {
    min-width: 50px;
    max-width: 50px;
    min-height: 50px;
    max-height: 50px;
    font-size: 36px;
    line-height: 46px;
  }
`;

export const RightsWrapper = styled.div`
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: "Roboto";
  font-size: 12px;
  font-weight: var(--font-weight-regular);
  line-height: 14px;
  letter-spacing: 0%;
  color: white;
  div {
    font-family: "Roboto";
    font-size: 12px;
    font-weight: var(--font-weight-regular);
    line-height: 14px;
    letter-spacing: 0%;
    color: white;
  }
  input {
    margin-right: 4px;
  }
  a {
    font-family: "Roboto";
    font-size: 12px;
    font-weight: var(--font-weight-regular);
    line-height: 14px;
    letter-spacing: 0%;
    text-align: left;
    color: #01c2ff;
  }
`;

export const HeadWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const StepsWrapper = styled.div`
  max-width: 560px;
  width: 100%;
  margin: 20px auto 60px;
  display: flex;
  flex-direction: column;
  gap: 18px;

  @media (max-width: 768px) {
    gap: 10px;
    max-width: 400px;
    width: 100%;
    padding: 0 10px 0 16px;
  }
`;

export const ConfirmBtnWrapper = styled.div`
  max-width: 400px;

  margin: 0px auto 100px;

  
`;

export const SuccessAuth = styled.div`
  max-width: fit-content;
  margin: 12px auto 30px;
  color: white;
  font-size: 26px;
`;
