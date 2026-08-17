import styled from "styled-components";

export const Wrapper = styled.div`
  position: relative;
  margin-bottom: 20px;
`;
export const Label = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-muted);
  margin-bottom: 7px;
`;

export const InputValue = styled.div<{ active: boolean }>`
  background: #f8f8f9;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;

  svg {
    transform: rotate(${({ active }) => (active ? 180 : 0)}deg);
    transition: 0.3s;
  }
`;

export const DropdownWrapper = styled.div<{ active: boolean }>`
  border: 1px solid #f8f8f9;
  background: white;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  padding: 10px 0;
  position: absolute;
  width: 100%;
  z-index: 20;
  display: ${({ active }) => (active ? "block" : "none")};
`;

export const Item = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 5px 12px;

  &:hover {
    background: #f8f8f9;
  }

  img {
    width: 35px;
    height: 35px;
    object-fit: cover;
    border-radius: 6px;
    overflow: hidden;
  }
`;

export const InputProjectWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  img {
    width: 35px;
    height: 35px;
    object-fit: cover;
    border-radius: 8px;
    overflow: hidden;
  }
`;
