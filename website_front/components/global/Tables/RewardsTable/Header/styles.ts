import styled from "styled-components";
import Typography from "../../../common/Typography";

export const HeaderWrapper = styled.div`
  display: flex;
  padding: 8px 16px 0;
  box-sizing: border-box;
  font-weight: var(--font-weight-regular);
  font-size: 12px;
  line-height: 14px;
  color: var(--color-text-muted);
  width: 1190px;
`;
export const Projects = styled(Typography)`
  width: 209px;
`;
export const Status = styled(Typography)`
  width: 275px;
  padding-left: 12px;
`;
export const Investors = styled(Typography)`
  width: 142px;
`;
export const ToTalRaised = styled(Typography)`
  width: 448px;
`;
export const LastFunding = styled(Typography)`
  width: auto;
`;
