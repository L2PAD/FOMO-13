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
export const Asset = styled(Typography)`
  width: 209px;
`;
export const Supply = styled(Typography)`
  width: 130px;
`;
export const Public = styled(Typography)`
  width: 175px;
`;
export const Seed = styled(Typography)`
  width: 202px;
`;
export const Private = styled(Typography)`
  width: 300px;
`;
