import styled from "styled-components";
import Typography from "../common/Typography";

export const FooterWrapper = styled.div`
  padding: 8px 32px 40px;
  background: #f8f8f9;
`;

export const FooterContent = styled.div`
  display: flex;
  justify-content: space-between;
  max-width: 100%;
  margin: 20px auto 0;
  flex-wrap: wrap;

  @media (max-width: 1024px) {
    width: 100%;
    gap: 58px;
    justify-content: space-between;
  }

  @media (max-width: 767px) {
    width: 100%;
    gap: 16px;
    flex-direction: column;
  }
`;

export const LeftWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  img {
    width: 149px;
    height: auto;
  }
  p {
    font-weight: var(--font-weight-semibold);
    font-size: 12px;
    line-height: 14px;
    color: rgba(115, 128, 148, 0.5);
  }
`;

export const ListsWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-around;

  @media (max-width: 1024px) {
    justify-content: space-between;
  }
`;

export const ListTitle = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: #0d0f2a;
  margin-bottom: 10px !important;
  margin-top: 19px !important;
`;

export const ListItemsWrapper = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: #525252;
  min-width: 138px;

  li {
    display: flex;
    align-items: center;
    gap: 4px;

    svg {
      width: 16px;
      height: 16px;
      path {
        fill: #525252;
      }
    }

    a {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: max-content;
    }
    button {
      background: transparent;
      border: none;
      padding: 0px;
      color: #525252;
    }
  }

  @media (max-width: 1024px) {
    svg {
      margin-bottom: -3px;
    }
  }
`;
export const TwoLinksWrapper = styled.div`
  display: flex;
  gap: 30px;
`;

export const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const InboxWrapper = styled.div`
  margin-top: 14px;
`;

export const InboxTitle = styled.div`
  div {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-primary);
    display: flex;
    flex-direction: column;
    margin-bottom: 8px;
  }

  span {
    display: block;
    font-weight: var(--font-weight-regular);
    font-size: 12px;
    line-height: 14px;
    color: var(--color-text-primary);
  }
`;

export const InboxInputWrapper = styled.div`
  position: relative;
  margin-top: 8px;
  width: 320px;

  input {
    background: #f3f3f380;
    border-radius: 8px;
    color: var(--color-text-primary);
    width: 320px;
    border: none;
    padding: 8px 40px 8px 8px;
    border: 1px solid #e5e5e5;

    &::placeholder {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 16px;
      color: var(--color-text-muted);
    }
  }

  button {
    background: var(--color-primary);
    border-radius: 99px;
    width: 16px;
    height: 16px;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: 8px;
    top: 8px;
    z-index: 5;

    svg {
      width: 5px;
      height: 8px;

      path {
        stroke: white;
      }
    }
  }
`;

export const ModalText = styled.div`
  margin-top: 12px;
`;

export const FomoLabel = styled.div`
  min-width: 100px;
  margin-top: auto;
  font-size: 12px;
  color: var(--color-text-muted);
`;
