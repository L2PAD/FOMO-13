import styled from "styled-components";
import Typography from "../../../../global/common/Typography";
import Input from "../../../../global/common/Input";
import { SearchIcon } from "../../../../global/Icons";

export const PageDescriptionWrapper = styled.div`
  margin-top: 16px;

  @media (max-width: 768px) {
    margin-top: 12px;
  }

  @media (max-width: 480px) {
    margin-top: 8px;
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

export const SearchWrapper = styled.div`
  margin-top: 24px;

  @media (max-width: 768px) {
    margin-top: 20px;
  }

  &.white-input {
    margin-top: 0px;

    input {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 16.8px;
      background: white;

      @media (max-width: 768px) {
        font-size: 13px;
        line-height: 15.6px;
      }

      @media (max-width: 480px) {
        font-size: 12px;
        line-height: 14.4px;
      }
    }
    svg {

      @media (max-width: 480px) {
        top: 6px;
      }
    }
  }
`;

export const SearchInput = styled(Input)`
  width: 100% !important;

  input {
    width: 100%;
    padding: 10px 12px 10px 36px;

    @media (max-width: 768px) {
      padding: 8px 10px 8px 32px;
    }

    &::placeholder {
      font-weight: var(--font-weight-semibold);
      font-size: 16px;
      line-height: 19px;
      color: rgba(115, 128, 148, 0.5);

      @media (max-width: 768px) {
        font-size: 15px;
        line-height: 18px;
      }

      @media (max-width: 480px) {
        font-size: 14px;
        line-height: 17px;
      }
    }

    transition: all 0.3s ease;

    &:hover {
      background: var(--input-hover);
    }
    &:focus {
      background: var(--input-active);
    }
  }
`;

export const SearchIconStyle = styled(SearchIcon)`
  position: absolute;
  left: 10px;
  top: 7px;

  @media (max-width: 768px) {
    left: 8px;
    top: 6px;
  }

  @media (max-width: 480px) {
    left: 6px;
    top: 5px;
    width: 16px;
    height: 16px;
  }
`;
