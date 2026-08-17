import styled from "styled-components";

export const Wrapper = styled.div`
  max-width: 730px;
  margin: 80px auto;
  max-height: 100vh;
  overflow: hidden;
`;

export const Head = styled.div`
  max-width: fit-content;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 18px;
  & h1 {
    font-family: Gilroy;
    font-size: 40px;
    font-weight: var(--font-weight-semibold);
    line-height: 49.52px;

    @media (max-width: 500px) {
      text-align: center;
      font-size: 32px;
    }
    @media (max-width: 400px) {
      text-align: center;
      font-size: 26px;
    }
  }
`;

export const Description = styled.div`
  margin-top: 20px;
  text-align: center;
  font-family: Gilroy;
  font-size: 32px;
  font-weight: var(--font-weight-medium);
  line-height: 38.82px;
  text-align: center;

  & a {
    color: var(--color-info);
  }

  @media (max-width: 500px) {
    font-size: 24px;
    line-height: 32px;
  }
`;

export const PageWrapper = styled.div`
  position: relative;
  height: 100vh;
  overflow: hidden;
`;

export const AnimationWrapper = styled.div`
  max-width: 865px;
  max-height: 519px;
  position: absolute;
  right: 0px;
  bottom: -62px;

  @media (max-width: 1200px) {
    max-width: 720px;
    max-height: 450px;
  }
`;
