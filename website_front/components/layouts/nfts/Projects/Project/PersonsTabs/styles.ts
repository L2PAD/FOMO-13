import styled from "styled-components";
import PersonCard from "../../../../../global/PersonCard";

export const Wrapper = styled.div`
  margin-top: 64px;
`;

export const PersonsWrapper = styled.div`
  display: flex;
  margin-top: 16px;
  gap: 16px;
  justify-content: center;
  width: 1204px;
  padding-bottom: 5px;
`;

export const PersonCardWrapper = styled(PersonCard)`
  flex: 1 0 18%;
  width: 228px !important;
  max-width: 228px !important;
`;

export const ShowAllWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 18px;
`;

export const ShowAllButton = styled.button`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-primary);
  border: none;
  background: none;
`;
