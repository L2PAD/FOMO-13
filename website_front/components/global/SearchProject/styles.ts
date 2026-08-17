import styled from "styled-components";

export const Wrapper = styled.div`
  & label {
    font-size: 16px;
    color: var(--color-text-muted);
    line-height: 19px;
  }
`;

export const SelectWrapper = styled.div`
  margin-top: 12px;
  position: relative;

  &.currency-select {
    width: 135px;
  }

  &.small-select {
    width: 74px;
    button {
      font-weight: var(--font-weight-semibold);
    }
    path {
      stroke: black;
      stroke-width: 1px;
    }
  }
`;

export const SelectButton = styled.button<{ isOpen: boolean }>`
  width: 100%;
  padding: 12px 8px;
  background-color: var(--color-white);
  border: 1px solid #e5e5e5;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  color: var(--color-text-primary);
  font-size: 14px;
  color: #0d0f2a;

  &:focus {
    outline: none;
  }

  .arrow {
    height: 13px;
    transition: transform 0.2s;
    transform: ${(props) => (props.isOpen ? "rotate(180deg)" : "rotate(0deg)")};
  }
`;

export const Dropdown = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 98%;
  left: 0;
  right: 0;
  max-height: ${(props) => (props.isOpen ? "250px" : "0")};
  overflow-y: auto;
  background-color: var(--color-white);
  transition: all 0.2s ease;
  z-index: 10;
  box-shadow: 2px 2px 8px 0px #00053014;
  border-radius: 0 0 4px 4px;
  border-top: none;
  gap: 0px !important;

  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar {
    width: 0;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;

  & .search-project-dropdown-input {
    width: 100%;

    > div {
      width: 100%;
    }

    input {
      width: 100% !important;
    }
  }

  & .searchResults {
    padding: 12px 0px;
  }
`;

export const Option = styled.div`
  width: 100%;
  text-align: center;
  cursor: pointer;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 14.4px;
  color: var(--color-text-muted);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:first-child {
    padding-top: 12px;
  }

  &:hover {
    color: black;
    background-color: #ededed;
  }
`;

export const Project = styled.div`
  display: flex;
  align-items: center;
  img {
    width: 20px;
    height: 20px;
    object-fit: cover;
    border-radius: 50%;
  }

  div {
    margin: 0px 4px 0px 8px;
  }

  span {
    font-size: 14px;
  }
`;
