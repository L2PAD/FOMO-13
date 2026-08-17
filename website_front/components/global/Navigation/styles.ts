import styled from "styled-components";
import Link from "next/link";
import Input from "../common/Input";
import { ArrowDownIcon, SearchIcon } from "../Icons";
import Button from "../common/Button";

export const HeaderWrapper = styled.div`
  padding: 0 36px;

  @media (max-width: 1205px) {
    padding: 0 16px;
  }

  @media (max-width: 768px) {
    display: none;
  }
`

export const Wrapper = styled.div<{ isAuthorized: boolean }>`
  border-radius: 8px;
    padding: ${({ isAuthorized }) =>
    isAuthorized ? "20px" : "20px"};
  box-shadow: 2px 2px 8px 0px #00053014;
  transition: box-shadow 0.3s ease;
  border-top-left-radius: 0px;
  border-top-right-radius: 0px;
`

export const MobileNavigation = styled.div`
  display: none;

  @media (max-width: 768px) {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: space-between;
    padding: 20px;
  }
`;

export const TopWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;

  @media (max-width: 768px) {
    display: none;
  }
`;

export const NavigationWrapper = styled.div<{ isAuthorized: boolean }>`
  position: relative;
  width: 100%;
  gap: 20px;
  display: flex;
  align-items: center;


  box-sizing: border-box;
  justify-content: space-between;
  border-radius: 8px;
  background: var(--color-white);
  border: none;
  box-shadow: none;
  transition: border-color 0.2s ease;
  margin: 20px auto 0px;
  height: 68px;

  .placeholder {
    display: none;
  }

  @media (max-width: 1204px) {
    max-width: calc(100% - 32px);
  }

  @media (max-width: 767px) {
    margin: 0px;
    gap: 12px;
    position: sticky;
    background: white;
    top: 0;
    z-index: 20;
    flex-direction: column;
    .placeholder {
      display: block;
    }
    display: none;
  }
`;
export const LogoImage = styled.img`
  width: 94px;
  height: 44px;
`;
export const LeftWrapper = styled.div`
  display: flex;
  align-items: center;
  @media (max-width: 768px) {
    width: fit-content;
  }
`;
export const RightWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
`;
export const ListWrapper = styled.div<{ open: boolean }>`
  list-style-type: none;
  align-items: center;

  @media (max-width: 1024px) {
    display: ${({ open }) => (open ? "flex" : "none")};
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    z-index: 30;
    background: white;
    width: 280px;
    height: 100vh;
    position: fixed;
    overflow-y: auto;
    right: 0;
    top: 0;
    padding: 23px 0 20px 9px;
  }
`;

export const ListItem = styled.div<{ active: boolean }>`
  color: ${({ active }) => (active ? "var(--color-text-primary)" : "var(--color-text-muted)")};
  font-weight: ${({ active }) => (active ? 600 : 400)};
  font-size: 16px;
  line-height: 19px;
  display: inline-block;
  position: relative;
  transition: all 0.3s ease;

  a {
    color: inherit;
    font-size: inherit;
  }
  &:not(:last-child) {
    margin-right: 20px;
  }

  &:hover {
    color: ${({ active }: { active?: boolean }) =>
    active ? "var(--color-text-primary)" : "rgba(7, 11, 53, 0.8)"};
  }

  &:active {
    color: ${({ active }: { active?: boolean }) =>
    active ? "var(--color-text-primary)" : "rgba(7, 11, 53, 0.4)"};
  }

  @media (max-width: 1024px) {
    padding: 7px;
    display: block;
  }

  @media (max-width: 1405px) {
    &:not(:last-child) {
      margin-right: 14px;
    }
  }
`;
export const Search = styled(Input) <{ open: boolean }>`
  margin-top: 4px;
  width: 100%;
  input {
    padding: 8px 12px 8px 36px;
    &::placeholder {
      font-weight: var(--font-weight-regular);
      font-size: 16px;
      line-height: 19px;
      color: var(--color-text-muted);
    }

    transition: all 0.3s ease;

    &:hover {
      background: var(--input-hover);
    }
    &:focus {
      background: var(--input-active);
    }
  }

  @media (max-width: 767px) {
    input {
      width: calc(100vw - 20px);
    }
  }
`;

export const TransparentOverlay = styled.div`
  width: 100vw;
  height: 100vh;
  left: 0;
  top: 0;
  z-index: 10;
  position: fixed;
`;

export const SearchWrapper = styled.div<{ open: boolean }>`
  position: relative;
  margin-left: auto;
  width: 100%;
  max-width: 400px;
  @media (max-width: 767px) {
    display: none;
  }
`;
export const SearchIconStyle = styled(SearchIcon)`
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);

  path {
    fill: var(--color-text-soft);
  }

  &.nav-icon {
    path {
      fill: var(--color-text-soft);
    }
  }
`;

export const OutlinedButton = styled(Button)`
  text-wrap: nowrap;

  span {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
  }
`;

export const ActionsButtonsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  & .connect-wallet-button{
    border-radius: 8px;
  }
  @media (max-width: 768px) {
    width: 100%;
    display: none;
    & .connect-wallet-button {
      width: 100%;
      border-radius: 8px;
    }
  }
`;
export const CartWrapper = styled.div`
  position: relative;
  width: 25px;
  cursor: pointer;

  @media (max-width: 768px) {
    display: none;
  }
`;

export const Count = styled.p`
  background: black;
  color: white;
  border-radius: 100%;
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  width: 15px;
  height: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  bottom: 0;
  right: 0;
`;

export const UserWrapper = styled.div`
  @media (max-width: 768px) {
    width: fit-content;
  }
`;
export const UserDropdownButton = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 160px;
  transition: 0.3s;
  cursor: pointer;
  padding: 4px 6px 4px 2px;
  border-radius: 16px;

  &:hover {
    background: #f5f6f8;
  }
  &:active {
    background: #f5f6f8;
    opacity: 0.7;
  }
  p {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-text-primary);
  }

  @media (max-width: 1024px) {
    width: fit-content;
  }

  @media (max-width: 768px) {
    .user-name {
      display: none;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
    }
  }
`;

export const UserDropdownArrow = styled(ArrowDownIcon) <{ rotate: boolean }>`
  transform: rotate(${({ rotate }) => (rotate ? 180 : 0)}deg);
  transition: 0.3s;
`;

export const UserDropdownWrapper = styled.ul<{ isOpen: boolean }>`
  position: fixed;
  z-index: ${({ isOpen }) => (isOpen ? 1000 : 1)};
  background: var(--color-white);
  border: 1px solid rgba(83, 98, 124, 0.07);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  border-radius: 0px;
  right: 0;
  top: 0;
  width: 340px;
  height: 100vh;
  overflow-y: auto;

  transform: translateX(${({ isOpen }) => (isOpen ? 0 : 370)}px);
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    max-width: 320px;
    border-radius: 0;
    width: 70vw;
    box-shadow: -200px 7px 261px 200px rgba(0, 0, 0, 0.75);
    -webkit-box-shadow: -200px 7px 261px 200px rgba(0, 0, 0, 0.75);
    -moz-box-shadow: -200px 7px 261px 200px rgba(0, 0, 0, 0.75);
  }

  @media (max-width: 480px) {
    width: 320px;
  }
`;

export const DropdownRowColored = styled.li`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-danger);
  cursor: default !important;

  font-size: 14px;
  font-weight: var(--font-weight-semibold);
`;

export const DropdownRow = styled.li<{ isPositive?: boolean }>`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  &.list-row {
    margin-top:12px;
    padding-left:12px;
  }

  span {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;
    color: var(--color-text-muted);
  }

  i {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 19px;
    color: ${({ isPositive }) => (isPositive ? "var(--main-green)" : "var(--color-text-primary)")};

    @media (max-width: 768px) {
      font-size: 14px;
    }
  }

  @media (max-width: 768px) {
    &:not(:last-child) {
      margin-bottom: 10px;
    }
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

export const DropdownRowWithLink = styled.li`
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
  margin-bottom: 12px;
  height: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px !important;

  &:last-child {
    margin-bottom: 0;
  }

  &.tool-link {
    padding-left:12px;  
    font-weight: var(--font-weight-medium);

    button {
      span{
        font-weight: var(--font-weight-medium);
      }
    }
  }
  & .copy-icon{
    margin-left: auto;
    padding-right:4px;
  }

  & .info-row {
    display: flex;
    gap: 8px;
    align-items: center;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-medium);

    span{
      color: var(--main-gray);
    }
  }

  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }

  a {
    display: grid;
    grid-template-columns: 0.1fr 1fr;
    width: 100%;
    gap: 8px;
    padding: 5px 0;
  }

  button {
    border: none;
    padding: 0;
    background: none;
    display: flex;
    align-items: center;
    width: 100%;
    gap: 15px;

    span {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 19px;
      color: var(--color-text-primary);
    }
  }

  svg {
    width: 16px;
    height: 16px;
  }

  &.discord {
    a span {
      color: var(--color-primary);
    }

    svg path {
      fill: var(--color-primary);
    }
  }

  & .feed-icon {
    width: 14px;
    height: 14px;
  }

  @media (max-width: 768px) {
    margin-bottom: 10px;
  }
`;

export const DropdownBlockButton = styled.button<{ isOpen: boolean }>`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 100%;
  letter-spacing: 0%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  color: var(--color-text-primary);

  & .block-title{
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
  }

  & .rotate-arrow {
    transition: transform 0.3s ease;
    transform: ${({ isOpen }) => (isOpen ? "rotate(180deg)" : "rotate(0deg)")};
  }

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

export const DropdownBlockWrapper = styled.div`
  margin-top: 20px;

  & .block-title {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 100%;
    color: var(--color-text-primary);
  }

  @media (max-width: 768px) {
    margin-top: 20px;
  }

  &.features{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap:10px;
  }

  & .feature {
    border: 1px solid var(--main-stroke);
    background: var(--main-bg-unactive);
    padding: 8px 12px;
    border-radius: 12px;
    display: grid;
    grid-template-columns: 0.2fr 1fr;
    align-items: center;
    gap:8px;

    span{
      font-weight: var(--font-weight-medium);
      font-size: 14px;
    }

    &:hover {
      opacity: 0.8;
    }

    &:active{
      background: white;
    }
  }
`;

export const DropdownBlockList = styled.div<{ isOpen: boolean }>`
  transition: max-height 0.3s ease;
  max-height: ${({ isOpen }) => (isOpen ? "300px" : "0px")};
  overflow: hidden;

  @media (max-width: 768px) {
    margin-bottom: 0;
  }
`;

export const MobileActions = styled.div`
  display: none;
  background: white;
  padding-left: 7px;

  @media (max-width: 1024px) {
    display: block;
  }
`;
export const Overlay = styled.div`
  position: absolute;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  display: block;
`;

export const BurgerButton = styled.button`
  border: none;
  background: none;
  display: none;
`;

export const SearchButton = styled.button`
  border: none;
  background: none;
  display: none;

  svg {
    width: 20px;
    height: 20px;
  }

  @media (max-width: 767px) {
    // display: block;
    padding: 10px;
  }
`;

export const CloseMobileSearch = styled.button`
  display: none;
  position: absolute;
  background: none;
  border: none;
  z-index: 30;
  right: 12px;
  top: 8px;

  @media (max-width: 767px) {
    display: block;
  }
`;

export const MobileLogout = styled.button`
  display: none;
  font-weight: var(--font-weight-regular);
  font-size: 16px;
  line-height: 19px;
  color: #e42736;
  border: none;
  background: none;
  padding-left: 7px;

  @media (max-width: 1024px) {
    display: block;
  }
`;

export const MobileUserDropdownWrapper = styled.div`
  display: none;

  @media (max-width: 1024px) {
    display: block;
  }
`;

export const UserDropdownRow = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  & > div {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19px;
  }

  button {
    border: none;
    background: none;
    padding: 5px;

    svg {
      width: 22px;
      height: 22px;
    }
  }
`;

export const MobileMenuWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const LanguageSwitcherWrapper = styled.div`
  position: relative;
  flex: 0 0 auto;
`;

export const LanguageIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  overflow: hidden;
  border-radius: 50%;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const LanguageButton = styled.button<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  width: 65px;
  min-width: 65px;
  height: 34px;
  padding: 0 7px;
  border: 1px solid
    ${({ isOpen }) => (isOpen ? "var(--color-primary)" : "var(--main-stroke)")};
  border-radius: 8px;
  background: ${({ isOpen }) => (isOpen ? "#E9F8F8" : "var(--color-white)")};
  color: ${({ isOpen }) => (isOpen ? "var(--color-primary)" : "var(--main-black)")};
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  &:active {
    opacity: 0.75;
  }

  @media (max-width: 768px) {
    width: 80px;
    min-width: 80px;
    height: 32px;
    padding: 0 7px;
    font-size: 11px;
  }
`;

export const LanguagePlanetIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  color: currentColor;
`;

export const LanguageMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 65px;
  min-width: 65px;
  padding: 4px;
  border: 1px solid rgba(83, 98, 124, 0.07);
  border-radius: 8px;
  background: var(--color-white);
  box-shadow: 2px 2px 8px 0px #00053014;
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  pointer-events: ${({ isOpen }) => (isOpen ? "auto" : "none")};
  transform: ${({ isOpen }) =>
    isOpen
      ? "translateY(0) scale(1)"
      : "translateY(-6px) scale(0.98)"};
  transform-origin: top right;
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 1200;
`;

export const LanguageOption = styled.button<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
  min-height: 28px;
  padding: 6px 5px;
  border-radius: 6px;
  color: ${({ isActive }) =>
    isActive ? "var(--color-primary)" : "var(--main-black)"};
  background: ${({ isActive }) => (isActive ? "#E9F8F8" : "transparent")};
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: #f5f6f8;
    color: var(--color-primary);
  }
`;

export const LanguageOptionCheck = styled.span<{ isVisible: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  flex: 0 0 12px;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-white);
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
`;

export const ListItemDropdownButton = styled.button<{
  active: boolean;
  open: boolean;
}>`
  color: ${({ active }) => (active ? "var(--color-text-primary)" : "var(--color-text-muted)")};
  font-weight: ${({ active }) => (active ? 600 : 400)};
  border: none;
  background: none;
  padding: 0;
  font-size: 16px;
  line-height: 19px;
  text-align: right;
  display: flex;
  gap: 6px;
  align-items: center;
  transition: 0.3s;
  &:hover {
    color: ${({ active }: { active?: boolean }) =>
    active ? "var(--color-text-primary)" : "rgba(7, 11, 53, 0.8)"};
  }

  &:active {
    color: ${({ active }: { active?: boolean }) =>
    active ? "var(--color-text-primary)" : "rgba(7, 11, 53, 0.4)"};
  }
  svg {
    transform: ${({ open }) => (open ? "rotate(180deg)" : "rotate(0)")};
    transition: 0.3s;
  }
`;

export const ListItemDropdownWrapper = styled.div<{
  active: boolean;
  grid: boolean;
}>`
  position: absolute;
  display: ${({ active, grid }) => (grid ? "grid" : "flex")};
  background: var(--color-white);
  box-shadow: 4px 4px 25px #eeeeee;
  border-radius: 16px;
  padding: 16px;
  flex-direction: column;
  gap: 16px;
  z-index: 2000;
  left: -20px;
  grid-template-columns: 1fr 1fr;
  grid-gap: 20px;
  transition: all 0.2s ease;
  opacity: ${({ active }) => (active ? 1 : 0)};
  top: ${({ active }) => (active ? "25px" : "35px")};
  pointer-events: ${({ active }) => (active ? "auto" : "none")};

  svg {
    width: 16px;
    height: 16px;
  }

  &.Backer {
    padding: 10px 20px;
  }
`;

export const ListItemDropdownItemWrapper = styled(Link)`
  display: flex;
  gap: 8px;

  div {
    width: 160px;

    p {
      font-weight: var(--font-weight-regular);
      font-size: 16px;
      line-height: 1;
      color: var(--color-text-primary);
    }
    span {
      font-weight: var(--font-weight-regular);
      font-size: 12px;
      line-height: 14px;
      color: var(--color-text-muted);
    }
  }

  &.Backer {
    width: 140px;
    align-items: center;
    transition: opacity 0.3s ease;

    &:hover {
      opacity: 0.7;
    }

    &:active {
      opacity: 0.6;
    }

    div {
      p {
        font-weight: var(--font-weight-regular);
        font-size: 16px;
        line-height: 19px;
        margin-bottom: 0px;
      }
    }

    path {
      stroke: var(--main-gray);
    }
  }

  &.Resources {
    width: 140px;
    align-items: center;
    transition: opacity 0.3s ease;

    &:hover {
      opacity: 0.7;
    }

    &:active {
      opacity: 0.6;
    }

    div {
      p {
        font-weight: var(--font-weight-regular);
        font-size: 16px;
        line-height: 19px;
        margin-bottom: 0px;
      }
    }

    svg {
      width: 22px;
      height: 22px;
    }
  }
`;

export const DropdownNumber = styled.b<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ isActive }) => (isActive ? "var(--main-red)" : "transparent")};
  color: ${({ isActive }) => (isActive ? "white" : "var(--color-text-primary)")};
  min-width: ${({ isActive }) => (isActive ? "22px" : "auto")};
  min-height: ${({ isActive }) => (isActive ? "22px" : "auto")};
  border-radius: ${({ isActive }) => (isActive ? "50%" : "0px")};
  font-size: ${({ isActive }) => (isActive ? "14px" : "16px")};
  font-weight: var(--font-weight-semibold);
`;

export const EyeIcon = styled.div`
  max-width: 19px;
  margin-left: auto;
  img {
    max-width: 100%;
    height: auto;
    transform: translateY(2px);
  }
`;

export const CreateButtonsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 30px;
  margin-top: 30px;

  button {
    width: 200px;
    font-size: 16px;
    color: #00aa90;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    font-weight: var(--font-weight-semibold);
  }

  @media (max-width: 768px) {
    margin-top: 20px;
    margin-bottom: 20px;
    gap: 10px;

    button {
      padding: 0;
      height: 28px;

      &:before {
        display: none;
      }
    }
  }
`;

export const LogOutBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-danger);
  padding-left:12px;
  margin-top: 14px;
  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
  }
`;


export const SectionWrapper = styled.div`
  padding:20px;
  border-bottom: 1px solid var(--main-stroke);
  &:last-child{
    border-bottom: none;
  }
`

export const SectionTitle = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  margin-bottom:20px;
  color: var(--main-gray);
`

export const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap:4px;

  div {
    display: flex;
    align-items: center;
    gap: 4px;

    div{
      button {
        padding: 0;
      }
    }

    svg {
      margin-top:1px;
    }
  }

  span{
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    color: var(--main-gray);
  }
`
