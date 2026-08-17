import styled from "styled-components";
import Typography from "../../../global/common/Typography";
import Input from "../../../global/common/Input";
import Dropdown from "../../../global/common/Dropdown";
import BaseCard from "../../../global/common/BaseCard";

export const PageDescriptionWrapper = styled.div`
  margin-bottom: 16px;
  margin-top: 16px;

  @media (max-width: 767px) {
    margin-top: 12px;
    margin-bottom: 12px;
  }
`;

export const SubTabsWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 12px;

  @media (max-width: 767px) {
    flex-wrap: wrap;
    gap: 8px;
  }
`;

export const SubTabsFavWrapper = styled.div`
  display: flex;
  gap: 18px;
  align-items: center;

  @media (max-width: 767px) {
    flex-wrap: wrap;
    gap: 12px;
  }
`;

export const SubTabsAction = styled.button<{ active: boolean }>`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  border-radius: 8px;
  padding: 8px 10px;
  border: none;

  color: ${({ active }) => (active ? "var(--color-primary)" : "rgba(115, 128, 148, 0.5)")};
  background: ${({ active }) =>
    active ? "rgba(0, 192, 153, 0.1)" : "rgba(115, 128, 148, 0.05)"};

  @media (max-width: 575px) {
    font-size: 14px;
    padding: 6px 8px;
  }
`;

export const AddFavAction = styled.button`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-primary);
  border: none;
  background: none;
  white-space: nowrap;
  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;
  @media (max-width: 575px) {
    font-size: 14px;
  }

  transition: opacity 0.3s ease;

  &:hover{
    opacity: 0.6;
  }

  
  &:active{
    opacity: 0.4;
  }
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

export const SearchInput = styled(Input)`
  width: 100% !important;

  input {
    width: 100%;
    padding: 8px 12px 8px 36px;
    &::placeholder {
      font-weight: var(--font-weight-semibold);
      font-size: 16px;
      line-height: 19px;
      color: rgba(115, 128, 148, 0.5);
    }
  }

  @media (max-width: 575px) {
    input {
      padding: 8px 10px 8px 32px;
      &::placeholder {
        font-size: 14px;
      }
    }
  }
`;

export const DropdownWrapper = styled(Dropdown)`
  border: none !important;
`;

export const ActionsWrapper = styled.div`
  margin-top: 20px;
  margin-bottom: 8px;
  display: grid;
  align-items: center;
  gap: 20px;
  grid-template-columns: 0.65fr 0.35fr;

  @media (max-width: 991px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  @media (max-width: 768px) {
    &.sentiment-actions {
      display: flex;
      flex-direction: column-reverse;
      align-items: flex-start;

      & .search-acc-input {
        position: absolute;
        bottom: -48px;
        width: 100%;
      }
    }
  }
`;

export const WrapperTitle = styled.p`
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-muted);
  margin-top: 80px;
  margin-bottom: 8px;

  @media (max-width: 767px) {
    margin-top: 40px;
    font-size: 18px;
    line-height: 22px;
  }
`;

export const TwitterWrapper = styled(BaseCard)`
  padding: 8px 12px !important;
  display: flex;
  gap: 10px;
  align-items: center;

  @media (max-width: 1200px) {
    width: calc(33% - 8px) !important;
  }

  @media (max-width: 900px) {
    width: calc(50% - 8px) !important;
  }

  @media (max-width: 600px) {
    width: 100% !important;
  }
`;

export const TwitterPostData = styled.div`
  width: 145px;

  h6 {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
  }

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
  }

  @media (max-width: 575px) {
    width: 120px;
    h6 {
      font-size: 13px;
    }
    p {
      font-size: 12px;
      line-height: 14px;
    }
  }
`;
export const TwitterPostContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: calc(100% - 42px);

  a {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-primary);
  }

  @media (max-width: 767px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;

    a {
      font-size: 13px;
    }
  }
`;

export const TwitterPostsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;

export const MainInfoRight = styled.div``;

export const ModeSwitchWrapper = styled.div`
  margin-bottom: 20px;

  @media (max-width: 767px) {
    margin-bottom: 12px;
  }
`;
