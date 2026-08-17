import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 382px;
  min-width: 382px;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  border-right: 1px solid #f0f2f5;

  @media (max-width: 768px) {
    max-width: 100%;
    min-width: 100%;
    min-height: 350px;
    border-right: none;
    border-bottom: 1px solid #f0f2f5;
  }
`;

export const ScrollArea = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const Logo = styled.div`
  padding: 10px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  img {
    max-width: 42px;
    height: auto;
  }
`;

export const LogoText = styled.div`
  display: flex;
  gap: 5px;

  span {
    margin-top: 4px;
    display: block;
    font-size: 22px;
    font-weight: var(--font-weight-semibold);
    text-align: left;
  }
  div {
    margin-top: 4px;
    display: block;
    font-size: 22px;
    font-weight: var(--font-weight-semibold);
    text-align: left;
    color: #28b2a1;
  }
`;

export const Header = styled.div`
  margin-top: 15px;
  padding: 0px 24px;
  display: flex;
`;

export const SearchInputWrapper = styled.div`
  max-width: 290px;
  width: 100%;
  margin-right: 12px;
  border: 1px solid #cccfd0;
  padding: 10px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  height: 40px;

  input {
    border: none;
    outline: none;
    padding: 0px;
    font-size: 16px;
    font-weight: var(--font-weight-regular);
    line-height: 19.36px;
    text-align: left;
    padding-left: 6px;
    width: 100%;
    transition: all 0.3s ease;
    &::placeholder {
      color: var(--color-text-soft);
    }
  }

  &:hover {
    background: var(--input-hover);

    input {
      background: var(--input-hover);
    }
  }

  &:focus {
    background: var(--input-active);

    input {
      background: var(--input-active);
    }
  }
`;

export const AddButton = styled.button`
  color: white;
  background: #28b2a1;
  width: 40px;
  min-width: 40px;
  height: 40px;
  border-radius: 8px;
  font-weight: var(--font-weight-regular);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #1b9889;
  }

  &:active {
    opacity: 0.8;
  }
`;

export const ListWrapper = styled.div``;

export const ListHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 4px 20px;
  margin-top: 20px;
  margin-bottom: 10px;
  background: #f9f9f9;

  span {
    display: block;
    margin-left: 4px;
    font-size: 12px;
    font-weight: var(--font-weight-medium);
    line-height: 14.52px;
    color: #818181;
  }
`;

export const List = styled.div`
  margin-top: 8px;
  
  @media (max-width: 768px) {
    padding: 6px 12px;
  }
`;

export const ChatItem = styled.button<{ isNew: boolean }>`
  padding: 8px 18px;
  position: relative;
  width: 100%;

  display: flex;
  align-items: center;
  transition: all 0.3s ease;

  &:hover {
    background: var(--input-hover);
  }

  &.selected {
    background: #28b2a126;
    border-width: 1px, 0px, 1px, 0px;
    border-color: #28b2a133;
  }

  /* UserAvatar styles - prevent stretching */
  > div:first-child {
    flex-shrink: 0;
    width: 38px;
    height: 38px;
    
    img {
      width: 38px;
      height: 38px;
      min-width: 38px;
      min-height: 38px;
      object-fit: cover;
      border-radius: 50%;
    }
  }

  .fomo-chat-username {
    color: ${({ isNew }) => (isNew ? "#333333" : "#5F5F5F")};
  }
  .fomo-chat-message {
    color: ${({ isNew }) => (isNew ? "#333333" : "#5F5F5F")};
  }

  @media (max-width: 768px) {
    padding: 8px 0px;
  }
`;

export const ChatInfo = styled.div`
  margin-left: 16px;
`;

export const Username = styled.p`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 21.78px;
  text-align: left;
  color: #717171;
  margin-bottom: 6px;
`;

export const Message = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 16.94px;
  text-align: left;
  color: #a0a0a0;
`;

export const Time = styled.div`
  position: absolute;
  top: 15px;
  right: 12px;
  font-size: 14px;
  line-height: 16.94px;
  font-weight: var(--font-weight-regular);
  color: #5f5f5f;
  text-align: right;
`;

export const NewMessages = styled.div`
  position: absolute;
  right: 12px;
  bottom: 6px;
  background: #28b2a1;
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  line-height: 8px;
  text-align: left;
  color: white;
  min-width: 20px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const SwipeWrapper = styled.div<{ translateX: number }>`
  position: relative;
  overflow: hidden;
  touch-action: pan-y;

  .chat-content {
    position: relative;
    z-index: 3;
    background: white;
    transform: translateX(${({ translateX }) => translateX}px) scale(1.01);
    transition: transform 0.3s ease;
    will-change: transform;
  }
`;

export const HoverZone = styled.div<{ side: "left" | "right" }>`
  position: absolute;
  top: 0;
  ${({ side }) =>
    side === "left" ? "left: 0" : "right: 0; &.active { width: 80px; } }"};
  width: 80px;
  height: 100%;
  z-index: 4;

  &.hidden {
    display: none;
    width: 0;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

export const SwipeActions = styled.div<{ side: "left" | "right" }>`
  position: absolute;
  top: 0;
  ${({ side }) => (side === "left" ? "left: 0" : "right: 0")};
  height: 99%;
  display: flex;
  align-items: center;
  z-index: 1;
`;

export const SwipeActionButton = styled.button<{
  variant: "unread" | "pin" | "delete";
}>`
  height: 100%;
  min-width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: white;
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  transition: all 0.2s ease;

  svg {
    width: 20px;
    height: 20px;
  }

   ${({ variant }) => {
    switch (variant) {
      case "unread":
        return `
          background: #1E88E5;
          &:active {
            background: #1565C0;
          }
        `;
      case "pin":
        return `
          background: #28B2A1;
          &:active {
            background: #1B9889;
          }
        `;
      case "delete":
        return `
          background: #EF5350;
          &:active {
            background: #D32F2F;
          }
        `;
    }
  }}
`;
