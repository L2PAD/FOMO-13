import styled from "styled-components";

export const ProjectsWrapper = styled.div`
  margin-bottom: 16px;
  margin-top: 16px;

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }
`;

export const SelectWrapper = styled.div<{ open: boolean }>`
  position: relative;

  & > div:first-child {
    position: relative;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: #f8f8f9;
    border-radius: 8px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    transition: 0.3s;
    height: 32px;

    svg {
      transition: 0.3s;
      position: absolute;
      top: 15px;
      right: 12px;
      transform: rotate(${({ open }) => (open ? "180deg" : "0")});
    }
  }
`;

export const DropdownWrapper = styled.div`
  padding: 16px;
  background: white;
  border-radius: 8px;
  position: absolute;
  top: 30px;
  width: 100%;
  left: 0;
  max-height: 200px;
  height: max-content;
  overflow-y: auto;
  border: 1px solid rgba(83, 98, 124, 0.07);
  z-index: 10;

  div {
    cursor: pointer;
    margin-bottom: 10px;
    font-weight: var(--font-weight-semibold);
  }
`;

export const SearchWrapper = styled.div`
  margin: 20px 0;

  input {
    font-weight: var(--font-weight-regular);
    font-size: 14px !important;
    &::placeholder {
      font-weight: var(--font-weight-regular);
      font-size: 14px !important;
      line-height: 19px;
      color: rgba(115, 128, 148, 0.5);
    }
  }

`;

export const AssetsWrapper = styled.div`
  margin-bottom: 18px;
  background: #f5fbfd;
  border-radius: 12px;
  padding: 20px;

  & .assets-list {
    max-height: 800px;
    overflow-y: auto;
  }
`;

export const AssetRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 0.2fr 0.1fr;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  padding: 15px 10px;
  border-top: 1px solid #f0f2f5;

  & > div {
    display: flex;
    gap: 10px;
    align-items: center;

    & > div {
      p {
        font-weight: var(--font-weight-semibold);
        font-size: 14px;
        line-height: 17px;
      }
      span {
        font-weight: var(--font-weight-regular);
        font-size: 14px;
        line-height: 16px;
        color: var(--color-text-muted);
      }
    }
  }
`;

export const AssetCheckboxes = styled.div`
  margin-left: 15px;
`;

export const AssetsHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 0.2fr 0.1fr;
  padding: 15px 10px;
  div {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    color: var(--color-text-muted);
  }
`;

export const CreateAssetWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f5fbfd;
  border-radius: 12px;
  padding: 20px;

  div {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 100%;
    letter-spacing: 0%;
  }
`;
