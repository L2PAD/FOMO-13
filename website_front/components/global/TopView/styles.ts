import styled from "styled-components";
import BaseCard from "../common/BaseCard";
import Typography from "../common/Typography";

export const ViewItemWrapper = styled(BaseCard)`
  flex: 1 0 46%;

  @media (max-width: 1024px) {
    flex: 1 0 100%;
  }
`;

export const Title = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-text-primary);
`;

export const ProjectsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const ProjectItemWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const ProjectLeftWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

export const ProjectTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-text-primary);
`;

export const ProjectDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
`;

export const ProjectValue = styled(Typography)<{
  color: "green" | "red" | "default";
}>`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: ${({ color }) =>
    color === "green" ? "var(--color-primary)" : color === "red" ? "var(--color-danger)" : "var(--color-text-primary)"};
`;
