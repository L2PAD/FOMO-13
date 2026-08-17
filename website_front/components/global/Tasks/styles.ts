import styled from "styled-components";
import BaseCard from "../common/BaseCard";

export const Wrapper = styled.div`
  padding-bottom: 12px;
  width: 100%;
`;

export const CreateCardWrapper = styled(BaseCard)`
  padding: 16px;
  width: 100%;
  margin-top: 12px;
  background: #f8f8f9;
`;

export const CardWrapper = styled.div`
  padding: 0;
  width: 100% !important;
  cursor: grab;
  background: var(--color-white);
  border: 1px solid rgba(83, 98, 124, 0.07);
  box-shadow: 4px 4px 0 #eeeeee;
  border-radius: 8px;
`;

export const HeaderInput = styled.input`
  width: 100%;
  border: none;
  background: none;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
`;

export const CreateCardActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  padding-top: 12px;
`;

export const AddButton = styled.button`
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  padding: 8px 12px;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-primary);
  background: none;
`;

export const CloseCreateCard = styled.button`
  border: none;
  background: none;
  padding: 0;
`;

export const HeaderCardWrapper = styled.div`
  padding: 9px 16px;
  display: flex;
  justify-content: space-between;
  background: #f8f8f9;

  button {
    border: none;
    background: none;
    padding: 0;
  }
`;

export const CardActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: white;

  svg {
    width: 24px;
    height: 24px;
  }

  button {
    border: none;
    background: none;
    padding: 0;
  }

  & > div:first-child {
    display: flex;
    gap: 12px;
  }
`;

export const CardImg = styled.div`
  max-width: 80px;
  margin: 10px auto;
  img {
    max-width: 80px;
  }
`;

export const CardDescription = styled.div`
  padding: 4px 10px;
  font-size: 14px;
`;
