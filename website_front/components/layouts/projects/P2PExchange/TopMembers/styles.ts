import styled from "styled-components";
import { SearchIcon } from "../../../../global/Icons";
import Dropdown from "../../../../global/common/Dropdown";
import BaseCard from "../../../../global/common/BaseCard";
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
      font-weight: var(--font-weight-regular);
      font-size: 16px;
      line-height: 19px;
      color: var(--main-gray);
    }
    @media (max-width: 480px) {
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

export const ContentWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 680px) {
    gap: 12px;
  }
`;

export const CommentWrapper = styled(BaseCard)`
  width: 100% !important;
  position: relative !important;
  display: flex;
  align-items: flex-start;
  padding: 16px;
  gap: 8px;

  .comment {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .likes {
      display: flex;
      gap: 5px;
      font-weight: var(--font-weight-semibold);
      align-items: center;
      margin-left: 10px;

      .like,
      .dislike {
        padding: 3px 10px;
        border-radius: 99px;
        display: flex;
        gap: 5px;
        align-items: center;
      }

      .dislike {
        background: #f8f8f9;
      }

      .like {
        background: var(--color-primary);
        color: var(--color-white);
      }
    }
  }

  @media (max-width: 767px) {
    padding: 16px !important;
  }
  @media (max-width: 480px) {
    .comment .likes {
      gap: 6px;
      .like,
      .dislike {
        padding: 2px 8px;
        font-size: 12px;
      }
    }
  }
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

  @media (max-width: 767px) {
    gap: 12px;
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

  @media (max-width: 480px) {
    font-size: 13px;
    span {
      font-size: 13px;
    }
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

export const ListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  @media (max-width: 480px) {
    gap: 10px;
  }
`;

export const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 16px;

  @media (max-width: 640px) {
    margin-top: 12px;
  }
`;
