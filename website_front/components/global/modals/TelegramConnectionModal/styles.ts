import styled from "styled-components";
import Typography from "../../common/Typography";

export const ContentWrapper = styled.div`
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const Title = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-text-primary);
  width: 100%;
  text-align: center;
`;

export const Description = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-primary);
  margin-top: 8px !important;
  width: 100%;
  text-align: center;
  white-space: normal !important;
`;

export const ListTitle = styled(Typography)`
  margin-top: 24px !important;
  font-weight: var(--font-weight-semibold);
  font-size: 12px;
  line-height: 14px;
  color: var(--color-text-primary);
  width: 100%;
`;

export const List = styled.ul`
  margin-top: 11px;
  margin-bottom: 23px;
`;

export const ListItem = styled.li`
  display: flex;
  width: 100%;
  gap: 6px;
  align-items: center;
`;

export const Check = styled.div`
  width: 18px;
  height: 18px;
  border-radius: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);

  svg {
    width: 12px;
  }
`;

export const ActionsWrapper = styled.div`
  display: flex;
  width: 100%;
  gap: 14px;
`;

export const CancelButton = styled.button`
  background: none;
  border: none;
  padding: 13px;
  width: 50%;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-primary);
`;

export const SubmitButton = styled.button`
  background: var(--color-primary);
  border-radius: 8px;
  border: none;
  padding: 13px;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  color: var(--color-white);
  width: 50%;
`;
