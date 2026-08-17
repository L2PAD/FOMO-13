import styled from "styled-components";

export const SliderWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
  margin-top: 20px;

  @media (max-width: 1024px) {
    max-width: 100%;
  }
`;

export const SlideCard = styled.div`
  background: #f5fbfd;
  border-radius: 12px;
  padding: 12px;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  @media (max-width: 768px) {
    padding: 14px;
    min-height: 180px;
  }
`;

export const TagsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
`;

export const Tag = styled.span`
  background: #e9f8f8;
  color: var(--color-primary);
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 11px;
    padding: 5px 10px;
  }
`;

export const TagBadge = styled.span`
  color: var(--color-primary);
  font-size: 12px;
  background: #e9f8f8;
  border-radius: 50%;
  padding: 2px 4px;
`;

export const PostContent = styled.p`
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  line-height: 100%;
  color: var(--color-text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

export const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
`;

export const UserAvatar = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
  }
`;

export const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const UserName = styled.span`
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  color: #1a1d26;
`;

export const Timestamp = styled.span`
  font-size: 12px;
  font-weight: var(--font-weight-regular);
  color: var(--color-text-muted);

  @media (max-width: 768px) {
    font-size: 11px;
  }
`;

export const ArrowsWrapper = styled.div`
  position: absolute;
  z-index: 10;
  top: 0;
  left: -12px;
  right: -12px;
  width: calc(100% + 24px);
  bottom: 0;

  display: flex;
  justify-content: space-between;
  pointer-events: none;

  button {
    pointer-events: all;
    padding: 6px;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.1);

      svg path {
        stroke: #00a991;
      }
    }

    @media (max-width: 768px) {
      padding: 5px;
    }
  }
`;
