import styled from "styled-components";
import Typography from "../../../../global/common/Typography";

export const PageDescriptionWrapper = styled.div`
  margin-top: 16px;
`;

export const PageDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
  white-space: normal !important;

  span {
    color: var(--color-text-muted);
  }

  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;
  }
`;

export const SocialsWrapper = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
  justify-content: space-between;

  & > div {
    display: flex;
    gap: 12px;
  }
`;

export const SocialButton = styled.button<{ active: boolean }>`
  padding: 8px 10px;
  border: none;
  background: ${({ active }) =>
    active ? "rgba(0, 192, 153, 0.1)" : "rgba(115, 128, 148, 0.05)"};
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;

  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: ${({ active }) => (active ? "var(--color-primary)" : "rgba(115, 128, 148, 0.5)")};

  svg {
    path,
    rect {
      fill: ${({ active }) =>
        active ? "var(--color-primary)" : "rgba(115, 128, 148, 0.5)"};
    }
  }

  @media (max-width: 450px) {
    span {
      display: none;
    }
  }
`;

export const TableWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 20px;

  & > div {
    width: 100%;
  }
`;
