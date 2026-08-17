import styled from "styled-components";

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

export const ModalContent = styled.div`
  background: var(--color-white);
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  position: relative;
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  left: 16px;
  background: transparent;
  border: none;
  color: #728094;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: #1a1d26;
  }
`;

export const UserSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
`;

export const UserAvatar = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 16px;
`;

export const UserName = styled.h2`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #1a1d26;
  margin: 0 0 4px;
`;

export const UserHandle = styled.p`
  font-size: 16px;
  font-weight: var(--font-weight-regular);
  color: var(--color-primary);
  margin: 0;
`;

export const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f2f5;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

export const StatLabel = styled.span`
  font-size: 12px;
  font-weight: var(--font-weight-regular);
  color: #728094;
  text-align: center;
`;

export const StatValue = styled.span`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: #1a1d26;
  text-align: center;
`;

export const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const InfoIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #f5fbfd;
  flex-shrink: 0;
`;

export const InfoLabel = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  color: #728094;
  flex: 1;
`;

export const InfoValue = styled.span<{ isVerified?: boolean }>`
  font-size: 16px;
  font-weight: var(--font-weight-medium);
  color: ${(props) =>
    props.isVerified === true
      ? "var(--color-primary)"
      : props.isVerified === false
        ? "var(--color-danger)"
        : "#1a1d26"};
`;
