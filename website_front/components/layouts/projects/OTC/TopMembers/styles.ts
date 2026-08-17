import styled from "styled-components";
import { SearchIcon } from "../../../../global/Icons";
import Dropdown from "../../../../global/common/Dropdown";
import Comment from "../../../../global/common/Comment";
import Input from "../../../../global/common/Input";

export const SearchWrapper = styled.div`
  margin-top: 24px;

  @media (max-width: 640px) {
    margin-top: 16px;
  }
`;
export const SearchInput = styled(Input)`
  width: 100% !important;

  input {
    width: 100%;
    padding: 10px 12px 10px 36px;
    &::placeholder {
      font-weight: var(--font-weight-semibold);
      font-size: 16px;
      line-height: 19px;
      color: rgba(115, 128, 148, 0.5);
    }

    @media (max-width: 480px) {
      padding: 10px 12px 10px 36px;
      &::placeholder {
        font-size: 14px;
      }
    }
  }
`;
export const SearchIconStyle = styled(SearchIcon)`
  position: absolute;
  left: 10px;
  top: 5px;
`;
export const DropdownWrapper = styled(Dropdown)`
  border: none !important;

  @media (max-width: 900px) {
    align-self: stretch;
    width: 100%;
  }
`;

export const HeaderWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

export const TopMembersHeaderWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 2px 2px 8px 2px #00053014;

  @media (max-width: 1120px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const TopMembersHeaderLeft = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;

  .info-button {
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    border: none;
    background: transparent;
    padding: 0;
    margin-top: 0;
    cursor: pointer;

    svg {
      width: 16px;
      height: 16px;
    }
  }

  @media (max-width: 1120px) {
    width: 100%;
  }

  @media (max-width: 767px) {
    .info-button {
      display: none;
    }
  }
`;

export const TopMembersDescriptionWrapper = styled.div`
  position: relative;
  min-width: 0;
  text-align: left;

  .title-row {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    flex-wrap: wrap;
  }

  h2 {
    margin: 0;
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 28px;
    color: var(--color-text-primary);
  }

  .members-count {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    line-height: 1;
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    background: rgba(4, 165, 132, 0.12);
  }

  .subtitle {
    display: none;
    margin: 6px 0 0;
    font-size: 14px;
    line-height: 18px;
    color: var(--color-text-muted);
    max-width: 540px;
  }

  .gray-description {
    position: absolute;
    top: 30px;
    left: 0;
    z-index: 2;
    min-width: 420px;

    .description-modal-text {
      font-size: 12px;
    }
  }

  @media (max-width: 1204px) {
    .gray-description {
      min-width: 50vw;
    }
  }

  @media (max-width: 767px) {
    .title-row {
      width: 100%;
      justify-content: flex-start;
    }

    h2 {
      font-size: 20px;
      line-height: 24px;
      text-align: left;
    }

    .subtitle {
      display: block;
      font-size: 13px;
      line-height: 17px;
      text-align: left;
      padding:2px 0px;
    }

    .gray-description {
      min-width: 300px;
      width: min(420px, calc(100vw - 48px));
    }
  }
`;

export const TopMembersHeaderControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-left: auto;

  .top-members-search {
    display: flex;
  }

  .top-members-filter {
    display: flex;
  }

  .top-members-balance {
    display: flex;
    align-items: center;

    .contact-btn {
      height: 35px;
      font-size: 12px;

      span {
        font-size: 12px;
        line-height: 16px;
      }
    }
  }

  @media (max-width: 1120px) {
    margin-left: 0;
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  @media (max-width: 767px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;

    .top-members-search,
    .top-members-filter,
    .top-members-balance {
      width: 100%;
    }

    .top-members-search > div {
      width: 100%;
      max-width: none;
    }

    .top-members-search > div input {
      width: 100%;
      height: 39px;
    }

    .top-members-filter > div {
      width: 100%;
    }

    .top-members-filter > div > div:first-child {
      width: 100%;
      min-height: 39px;
      justify-content: center;
    }

    .top-members-balance {
      grid-column: 1 / -1;
    }

    .top-members-balance .top-members-balance-buttons {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .top-members-balance .top-members-balance-buttons .contact-btn {
      width: 100% !important;
      max-width: none;
      height: 39px;
    }

    .top-members-balance .top-members-balance-buttons .contact-btn span {
      display: inline !important;
    }
  }
`;

export const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;

  @media (max-width: 900px) {
    gap: 12px;
  }
  @media (max-width: 640px) {
    gap: 10px;
  }
`;

export const Content = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const CommentItem = styled(Comment)`
  & > div:last-child {
    display: none;
  }

  @media (max-width: 767px) {
    & > div:first-child {
      margin-bottom: 50px;
    }
  }
`;

export const ActionsWrapper = styled.div`
  z-index: 2;
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 16px 0 0 16px;

  @media (max-width: 767px) {
  }
`;

export const DefaultActionWrapper = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-primary);
    display: flex;
    gap: 8px;
  }
`;

export const RatingWrapper = styled.i`
  display: flex;
  align-items: center;
  gap: 4px;

  svg {
    width: 16px;
    margin-top: -3px;
  }
`;

export const StatusWrapper = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-primary);
  }
`;

export const HeaderSwitchWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    gap: 8px;
  }
`;
export const SwitchButton = styled.button<{ active: boolean }>`
  border: none;
  padding: 8px 10px;
  border-radius: 8px;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: ${({ active }) => (active ? "var(--color-primary)" : "rgba(115, 128, 148, 0.5)")};
  background: ${({ active }) =>
    active ? "rgba(0, 192, 153, 0.1)" : "rgba(115, 128, 148, 0.05)"};

  @media (max-width: 640px) {
    flex: 1 1 calc(50% - 8px);
    font-size: 14px;
  }
  @media (max-width: 420px) {
    flex: 1 1 100%;
    font-size: 13px;
    padding: 8px;
  }
`;

export const CommentWrapper = styled.div`
  position: relative; /* keep ActionsWrapper absolute safe on mobile */
`;

export const DealWrapper = styled.div<{ type: "buy" | "sell" }>`
  background: linear-gradient(90deg, #d9f1ed 0%, var(--color-white) 100%);
  border-radius: 8px;
  box-shadow: 2px 2px 8px 2px #00053014;
  padding: 12px 20px;

  @media (max-width: 640px) {
    padding: 10px 14px;
  }
  @media (max-width: 480px) {
    padding: 8px 12px;
  }
`;

export const DealInfo = styled.div``;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;

  @media (max-width: 820px) {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
`;

export const Name = styled.div`
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

export const Date = styled.div`
  margin-left: 20px;
  color: var(--color-text-muted);
  font-size: 14px;

  @media (max-width: 480px) {
    font-size: 12px;
    margin-left: 12px;
  }
`;

export const Description = styled.div`
  margin: 8px 0px 12px;
  font-size: 14px;
  color: var(--color-text-primary);
  word-break: break-word;
  overflow-wrap: anywhere;
`;

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
`;

export const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    gap: 8px;
  }
`;

export const HeaderRightItem = styled.div`
  display: flex;
  align-items: center;

  span {
    color: var(--color-text-muted);
    font-size: 14px;
  }
  div {
    margin-left: 6px;
  }
  &.deal-status {
    color: var(--color-primary);
    div {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
    }
  }
  &.deal-risk {
    div {
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
    }
  }
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;

  div {
    display: flex;
    align-items: center;
    gap: 5px;

    span {
      color: var(--color-text-primary);
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
    }
  }

  @media (max-width: 480px) {
    gap: 12px;
    div span {
      font-size: 12px;
    }
  }
  @media (max-width: 400px) {
    gap: 10px;
  }
`;

export const OtcCommentItem = styled.div``;

export const Reviews = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;

  @media (max-width: 640px) {
    gap: 12px;
    margin: 16px 0;
  }
  @media (max-width: 400px) {
    gap: 10px;
    margin: 12px 0;
  }
`;
