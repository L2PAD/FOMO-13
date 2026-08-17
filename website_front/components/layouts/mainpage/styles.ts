import styled from "styled-components";
import Input from "../../global/common/Input";

export const SearchInput = styled(Input)`
  width: 100% !important;
  margin-top: 24px;

  svg {
    margin-top: 5px;
    margin-left: 5px;
    path {
      fill: #c4c4c4;
    }
  }

  input {
    width: 100%;
    padding: 16px 83px 16px 44px;
    &::placeholder {
      font-weight: var(--font-weight-semibold);
      font-size: 16px;
      line-height: 19px;
      color: rgba(115, 128, 148, 0.5);
    }
  }
`;

export const SearchWrapper = styled.div`
  position: relative;
  width: 80%;

  button {
    border: none;
    background: none;
    padding: 0;
    position: absolute;
    right: 16px;
    top: 13px;
    font-weight: var(--font-weight-medium);
    font-size: 20px;
    line-height: 24px;
    color: #ec2e10;
    z-index: 10;

    @media (max-width: 992px) {
      top: 35px;
    }
    @media (max-width: 767px) {
      font-weight: var(--font-weight-medium);
      font-size: 14px;
      line-height: 16px;
      top: 40px;
    }
  }
`;
