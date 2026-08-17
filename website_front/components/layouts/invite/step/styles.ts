import styled from "styled-components";

interface StepWrapperProps {
  isActive: boolean;
}

export const StepWrapper = styled.div<StepWrapperProps>`
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  height: 64px;
  padding: 19px 23px 19px 70px;
  background: linear-gradient(
    267.73deg,
    rgba(10, 125, 190, 0.9) 0.083%,
    rgba(4, 59, 91, 0.2) 48.089%,
    rgba(10, 125, 190, 0.9) 101.149%
  );
  cursor: ${(props) => (props.isActive ? "pointer" : "not-allowed")};
  opacity: ${(props) => (props.isActive ? 1 : 0.7)};
  @media (max-width: 710px) {
    margin: 0 auto;
    transform: translateX(6px);
  }

  &:hover {
    background: ${(props) =>
      props.isActive
        ? "linear-gradient(267.73deg, rgba(10, 125, 190, 1) 0.083%,rgba(4, 59, 91, 0.6) 48.089%,rgba(10, 125, 190, 1) 101.149%)"
        : "linear-gradient(267.73deg, rgba(10, 125, 190, 0.9) 0.083%,rgba(4, 59, 91, 0.2) 48.089%,rgba(10, 125, 190, 0.9) 101.149%)"};
  }
`;
export const StepIndex = styled.div`
  position: absolute;
  top: -16px;
  left: -30px;
  width: 60px;
  height: 60px;
  img {
    position: absolute;
    top: 0px;
    left: 0px;
  }
  div {
    position: absolute;
    top: 55%;
    left: 60%;
    z-index: 1;
    font-style: italic;
    color: rgb(255, 255, 255);
    font-family: "Roboto";
    font-size: 24px;
    font-weight: var(--font-weight-regular);
    line-height: 28px;
    letter-spacing: 0px;
    text-align: center;
  }
`;
export const StepText = styled.div`
  color: rgb(255, 255, 255);
  font-family: "Roboto";
  font-size: 20px;
  font-weight: var(--font-weight-medium);
  line-height: 23px;
  letter-spacing: 0px;
  text-align: left;
`;
export const StepIcon = styled.div`
  max-width: 38px;
  margin-left: auto;
`;
