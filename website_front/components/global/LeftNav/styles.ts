import styled from "styled-components";
import { mainGlobalDark } from "../../../styles/mainGlobalDark";

export const Wrapper = styled.div<{ isOpen: boolean; showOnDesktop?: boolean }>`
  position: fixed;
  z-index: 1000;
  height: 100%;
  display: ${({ showOnDesktop = true }) => (showOnDesktop ? "flex" : "none")};
  flex-direction: column;
  transition: width 0.3s ease;
  width: ${({ isOpen }) => (isOpen ? "300px" : "64px")};
  padding: 20px 0px;
  background-color: var(--color-white);
  box-shadow: 2px 2px 8px 0px #00053014;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 768px) {
    display: flex;
    left: ${({ isOpen }) => (isOpen ? "0" : "-100%")};
    top: 0;
    padding: 20px;
  }
`;

export const ListWrapper = styled.div`
  margin-top: 40px;
  margin-bottom: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;

  @media (max-width: 768px) {
    margin-top: 20px;
    margin-bottom: auto;
  }
`;

export const LogoWrapper = styled.div``;

export const Header = styled.div<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0px 20px;

  & .nav-logo-wrapper {
    display: ${({ isOpen }) => (isOpen ? "block" : "none")};
  }

  & button {
    &:hover {
      opacity: 0.7;
    }
    &:active {
      opacity: 0.6;
    }
    & img {
      transition: all 0.3s ease;
      transform: ${({ isOpen }) => (isOpen ? "rotate(180deg)" : "")};
    }
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

export const SearchContainer = styled.div`
  align-items: center;
  padding: 8px;
  display: none;
  background: #f9f9f9;
  border-radius: 8px;

  @media (max-width: 768px) {
    display: flex;
  }

  & input {
    flex: 1;
    border: none;
    outline: none;
    padding: 8px 12px;
    font-size: 14px;
    background: transparent;

    &::placeholder {
      color: #aaa;
    }
  }

  & button {
    background: none;
    border: none;
    cursor: pointer;

    &:hover {
      opacity: 0.7;
    }
  }
`;

export const MenuItem = styled.div<{
  isOpen: boolean;
  isVisible: boolean;
  isActive: boolean;
}>`
  & .menu-item-icon {
    opacity: ${({ isVisible }) => (isVisible ? 1 : 0.3)};
  }
  & .nav-item-name {
    display: ${({ isOpen }) => (isOpen ? "block" : "none")};
    opacity: ${({ isVisible }) => (isVisible ? 1 : 0.3)};
  }

  & .nav-item-arrow {
    visibility: ${({ isOpen }) => (isOpen ? "visible" : "hidden")};
  }

  & .left-nav-title {
    background: ${({ isActive }) => (isActive ? "#F5FBFD" : "transparent")};

    path {
      stroke: ${({ isActive }) => (isActive ? "var(--color-primary)" : "var(--color-text-primary)")};
    }
  }

  @media (max-width: 768px) {
    a.active {
      color: var(--color-primary);
    }

    &.active {
      color: var(--color-primary);

      & > div {
        color: var(--color-primary);
      }
      svg path {
        stroke: var(--color-primary);
      }
    }
  }
`;

export const ItemName = styled.span``;

export const MenuTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  padding: 6px 20px;
  margin-bottom: 6px;
  transition: background 0.3s ease;
  max-height: 36px;
  &:hover {
    background: var(--input-hover);
  }

  &:active {
    background: var(--input-active);
  }

  @media (max-width: 768px) {
    padding: 6px 12px;
  }

  & .icon-wrapper {
    position: relative;
  }

  & .update-marker {
    position: absolute;
    z-index: 1;
    top: 25%;
    right: -2px;
    transform: translateY(-50%);
    background: var(--color-danger);
    width: 8px;
    height: 8px;
    border-radius: 50px;
  }
`;

export const ArrowWrapper = styled.div<{ isOpen: boolean }>`
  margin-left: auto;
  transition: transform 0.3s ease;
  transform: ${({ isOpen }) => (isOpen ? "rotate(180deg)" : "rotate(0deg)")};

  &.sub-item {
    fill: gray;
  }
`;
export const EditItem = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  &.nav-item-link {
    opacity: 0.5 !important;
  }

  img {
    position: absolute;
    right: 32.5px;
    max-width: 18px;
    height: auto;
  }
  font-size: 14px;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);

  &:hover {
    opacity: 0.8;
  }
`;
export const SubMenu = styled.div<{ isOpen: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-left: 53px;
  max-height: ${({ isOpen }) => (isOpen ? "425px" : "0px")};
  transition: max-height 0.3s ease;
  overflow: hidden;

  &.second-sub-menu {
    margin: 0px 0px 0px 34px;

    a {
      &:first-child {
        margin-top: 8px;
      }
    }
    button {
      &:first-child {
        margin-top: 10px;
      }
    }
  }

  a {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    img {
      position: absolute;
      right: 32.5px;
      max-width: 18px;
      height: auto;
    }
    font-size: 14px;
    color: var(--color-text-muted);
    font-weight: var(--font-weight-semibold);

    &:hover {
      opacity: 0.8;
    }
  }
`;

export const LinkItem = styled.a`
  color: #333;
  text-decoration: none;
  display: flex;
  padding-right: 20px;
`;

export const SubMenuTitle = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const EyeButton = styled.button`
  margin-left: auto;
  img {
    max-width: 50%;
    height: auto;
  }
`;

export const EditBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  
  width: 100%;
  background: #f8f8f9;
  padding: 14px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 14px;
  transition: all 0.3s ease;
  border-radius: 8px;
  &:hover {
    background: var(--input-hover);
  }

  &:active {
    background: var(--input-active);
  }
`;

export const EditActions = styled.div`
  max-width: 260px;
  width: 100%;
  margin: 40px auto 0;

  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const Action = styled.button<{ actionType: "red" | "green" }>`
  max-width: 120px;
  width: 100%;
  padding: 14px;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  background: #f8f8f9;
  color: ${({ actionType }) => (actionType === "red" ? "var(--color-danger)" : "var(--color-primary)")};
  transition: all 0.3s ease;
  &:hover {
    background: var(--input-hover);
  }

  &:active {
    background: var(--input-active);
  }
`;


export const EmptyStateButtons = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

export const ExploreMenuSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

export const ExploreButton = styled.button<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  width: 100%;
  background: linear-gradient(180deg, #0B1220 0%, #141d3a 100%);
  text-align: center;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  min-width:36px;
  min-height:38px;

  span{
    color:#fff;
  }

  & svg path { stroke: #ffffff; }

  .intel-pro {
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 0.5px;
    color: #ffffff;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.28);
    padding: 2px 6px;
    border-radius: 999px;
    line-height: 1;
  }
  .intel-ext { margin-left: auto; display: inline-flex; }
  .intel-ext svg path { stroke: rgba(255, 255, 255, 0.8); }

  &:hover {
    background: linear-gradient(180deg, #0f1730 0%, #1a2547 100%);
    border-color: rgba(255, 255, 255, 0.24);
    box-shadow: 0 6px 16px rgba(11, 18, 32, 0.35);
  }

  &:active {
    opacity: 0.85;
  }

  & .arrow-right {
    margin-left: auto;
    transition: transform 0.25s ease;
    transform: ${({ isOpen }) => (isOpen ? "rotate(180deg)" : "rotate(0deg)")};
  }
`;

export const ExploreMenuContainer = styled.div<{ isOpen: boolean }>`
  width: 100%;
  overflow: hidden;
  max-height: ${({ isOpen }) => (isOpen ? "400px" : "0px")};
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  transform: ${({ isOpen }) => (isOpen ? "translateY(0)" : "translateY(-6px)")};
  transition: max-height 0.35s ease, opacity 0.25s ease, transform 0.3s ease;
  pointer-events: ${({ isOpen }) => (isOpen ? "auto" : "none")};
  margin-top: ${({ isOpen }) => (isOpen ? "12px" : "0")};
`;

export const ExploreMenuWrapper = styled.div`
  width: 100%;
  
  align-self: stretch;
  border-radius: 12px;
  border: 1px solid #e6eaf2;
  background: var(--color-white);
  box-shadow: 0px 12px 28px rgba(4, 6, 22, 0.05);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const ExploreMenuLink = styled.a<{ disabled?: boolean }>`
  display: block;
  width: 100%;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.06em;
  color: ${({ disabled }) => (disabled ? "#a8b0bd" : "var(--color-text-primary)")};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: ${({ disabled }) => (disabled ? "#a8b0bd" : "var(--main-green)")};
  }
`;
