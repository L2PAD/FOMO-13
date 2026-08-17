import styled from "styled-components";

export const Label = styled.label`
  font-weight: var(--font-weight-semibold);
`;

export const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Input = styled.input`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  background: #f8f8f9;
  border: none;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;

  &::placeholder {
    color: var(--color-text-soft);
    font-size: 14px;
  }
`;

export const Results = styled.div`
  margin-top: 37px;
`;

export const CurrencyBtn = styled.button`
  transition: color 0.3s ease;
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    color: #05c9a1;
  }

  &.rotate {
    transform: rotate(180deg);
  }
`;

export const SearchWrapper = styled.div`
  position: relative;
`;

export const SearchResult = styled.div`
  position: absolute;
  z-index: 1;
  top: 63px;
  max-width: 320px;
  width: 100%;
  border-radius: 4px;
  max-height: 202px;
  overflow-y: auto;
  background: white;
  box-shadow: 2px 2px 4px 2px rgba(0, 0, 0, 0.208);
  display: flex;
  flex-direction: column;
`;

export const ResultWrapper = styled.div`
  width: 100%;
`;

export const SearchItemImg = styled.img`
  max-width: 50px;
  border-radius: 50%;
`;

export const SearchItem = styled.button`
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  cursor: pointer;
  background: white;
  border: none;
  transition: background 0.3s ease;

  &:hover {
    background: rgba(128, 128, 128, 0.283);
  }
`;

export const SearchItemBody = styled.div`
  max-width: 180px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  text-align: left;
`;

export const SearchItemTitle = styled.div`
  font-size: 17px;
  font-weight: var(--font-weight-semibold);
`;

export const SearchItemDesc = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);
`;

export const SelectedCollection = styled.div`
  margin-top: 8px;
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 7px;
  border-radius: 8px;
  background: #f8f8f9;
`;

export const RemoveCollection = styled.div`
  position: absolute;
  right: 15px;

  button {
    padding: 6px 12px;
  }
`;

export const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px;
  background: white;
  box-shadow: 2px 2px 4px 2px rgba(0, 0, 0, 0.208);
  border-radius: 5px;
`;
