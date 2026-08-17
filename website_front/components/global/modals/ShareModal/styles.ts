import styled from "styled-components";

export const InputWrapper = styled.div`
  margin-top: 16px;
  position: relative;
  & > p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 8px;
  }

  & > input {
    border: none;
    width: 100%;
    background: rgba(245, 249, 253, 1);
    border-radius: 8px;
    padding: 10px 40px 10px 12px;
    color: var(--main-gray);
    transition: background 0.3s ease;

    &:hover{
      background: rgba(235, 239, 243, 1);
    }
  }
  & > button {
    border: none;
    background: none;
    position: absolute;
    bottom: 0;
    right: 10px;
    padding: 2px;
    svg {
      width: 20px;
      height: 20px;
    }
    transition: opacity 0.3s ease;

    &:hover{
      opacity: 0.6;
    }
    
    &:active{
      opacity: 0.4;
    }
  }

  @media (max-width: 480px) {
    & > input {
      font-size: 14px;
      padding: 8px 34px 8px 10px;
    }
  }
`;

export const SocialsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;

  button {
    background: rgba(0, 192, 153, 0.1);
    border-radius: 8px;
    width: 110px;
    height: 110px;
    border: none;
    box-shadow: 4px 4px 0px #eeeeee;
    transition:all 0.3s ease;
    
    &:hover{
      background: rgba(0, 192, 153, 0.2);
    }

    &:active{
      opacity:0.8;
    }

    svg {
      width: 64px;
      height: 64px;
    }
  }

  @media (max-width: 640px) {
    gap: 10px;
    button {
      width: 100px;
      height: 100px;
    }
    button svg {
      width: 52px;
      height: 52px;
    }
  }
`;
