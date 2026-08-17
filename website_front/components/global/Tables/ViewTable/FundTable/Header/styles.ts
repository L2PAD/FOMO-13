import styled from "styled-components";
import Typography from "../../../../common/Typography";

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
export const Funds = styled(Typography)`
  width: 273px;
`;
export const Projects = styled(Typography)`
  width: 314px;
`;
export const ATHRoi = styled(Typography)`
  width: 150px;
  padding-left: 12px;
`;
export const CurrentRoi = styled(Typography)`
  width: 238px;
`;
export const RedFlags = styled(Typography)`
  width: 90px;
`;
