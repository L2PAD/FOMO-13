import styled from "styled-components";
import BaseCard from "../BaseCard";

export const FlagsListsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 16px;
  gap: 20px;

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 32px;
  }
`;

export const FlagsList = styled(BaseCard)`
  width: 100%;
`;

export const FlagsListItem = styled.li`
  display: flex;
  gap: 8px;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-primary);
  width: max-content;
  align-items: center;
  margin-bottom: 12px;
  width: 100%;

  span {
    display: block;
    max-width: 360px;
  }

  & .remove-btn {
    display: flex;

    svg {
      width: 12px;
      height: 12px;
    }
  }
`;
