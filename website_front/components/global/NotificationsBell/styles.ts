import styled, { keyframes } from "styled-components";

export const BellButton = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid #e6eaf0;
  background: #fff;
  color: #1a1d26;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: #f4faf8;
    border-color: #04a584;
    color: #04a584;
  }
`;

export const Dot = styled.span`
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  box-shadow: 0 0 0 2px #fff;
`;

export const Panel = styled.div`
  position: absolute;
  top: 52px;
  right: 0;
  width: 360px;
  max-width: 92vw;
  max-height: 460px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #e6eaf0;
  border-radius: 16px;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.16);
  z-index: 1000;
`;

export const PanelHead = styled.div`
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #fff;
  border-bottom: 1px solid #eef1f4;
  font-weight: 700;
  color: #1a1d26;

  button {
    border: none;
    background: transparent;
    color: #94a3b8;
    cursor: pointer;
    display: inline-flex;
    &:hover { color: #1a1d26; }
  }
`;

export const Row = styled.div<{ $unread?: boolean }>`
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f1f3f5;
  background: ${({ $unread }) => ($unread ? "#f2fbf8" : "#fff")};
  transition: background 0.12s ease;

  &:hover { background: #f4faf8; }
`;

export const RowIcon = styled.div<{ $type?: string }>`
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: ${({ $type }) =>
    $type === "REPOST" ? "#04a584" :
    $type === "LIKE" ? "#ef4444" :
    $type === "REPLY" ? "#3b82f6" :
    $type === "FOLLOW" ? "#8b5cf6" :
    "#0f766e"};
`;

export const RowBody = styled.div`
  flex: 1 1 auto;
  min-width: 0;

  p {
    margin: 0 0 2px;
    font-size: 13.5px;
    color: #1a1d26;
    strong { font-weight: 700; }
  }
  .preview {
    display: block;
    font-size: 12.5px;
    color: #52606d;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .time {
    display: block;
    margin-top: 3px;
    font-size: 11.5px;
    color: #94a3b8;
  }
`;

export const Empty = styled.div`
  padding: 34px 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 13.5px;
`;

const slideIn = keyframes`
  from { transform: translateY(12px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

export const ToastWrap = styled.div`
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 4000;
`;

export const Toast = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 340px;
  max-width: 92vw;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e6eaf0;
  border-left: 4px solid #04a584;
  border-radius: 14px;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
  cursor: pointer;
  animation: ${slideIn} 0.22s ease;

  button {
    border: none;
    background: transparent;
    color: #94a3b8;
    cursor: pointer;
    margin-left: auto;
    display: inline-flex;
    &:hover { color: #1a1d26; }
  }
`;
