import styled from "styled-components";
import BaseCard from "../BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgb(255, 255, 255);
  border: 1px solid var(--Stroke, #f0f2f5);
  box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
  border-radius: 12px;
`;

export const Item = styled.div`
  display: flex;
  align-items: center;

  padding: 12px;
  background: var(--color-surface-subtle);
  border: 1px solid #f0f2f5;
  border-radius: 8px;

  img {
    width: 38px;
    height: 38px;
    border-radius: 50%;
  }
`;

export const Project = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
  }
`;

export const Value = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  margin-left: auto;

  input {
    background: white;
    text-align: right;
    font-weight: var(--font-weight-semibold);
  }
`;

export const Input = styled.input`
  padding: 4px 6px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  text-align: right;
  background: transparent;
  color: inherit;

  &:focus {
    outline: none;
    border-color: #999;
  }
`;
