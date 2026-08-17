import styled from "styled-components";
import Typography from "../../common/Typography";

export const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  max-height: 500px;
  margin-top: 24px;
`;

export const EventWrapper = styled.div`
  padding: 16px;
  display: flex;
  align-items: center;
  background: var(--color-white);
  border: 1px solid rgba(83, 98, 124, 0.07);
  border-radius: 8px;
`;

export const ProjectWrapper = styled.div`
  display: flex;
  gap: 10px;
  margin-right: 27px;
`;

export const ProjectTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-primary);
  width: 120px;
`;

export const ProjectDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  width: 120px;
`;

export const StatusWrapper = styled.div`
  width: 60px;
`;

export const EventNameWrapper = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-primary);
  width: 90px;
  margin-right: 20px;
`;

export const DateWrapper = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-primary);
  width: 147px;
  margin-right: 30px;
`;

export const TimerWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-right: 40px;
`;

export const TimerItem = styled(Typography)`
  display: flex;
  flex-direction: column;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-primary);

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 12px;
    line-height: 14px;
    color: var(--color-text-muted);
  }
`;

export const RatingWrapper = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;

  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    color: var(--color-text-primary);
  }

  svg {
    width: 24px;
    height: 24px;
    margin-top: -5px;
  }
`;
