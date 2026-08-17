import styled from "styled-components";
import Typography from "../../../../common/Typography";
import { gridColumns } from "../styles";

export const HeaderWrapper = styled.div`
  display: grid;
  grid-template-columns: ${({}) => gridColumns};
  margin-bottom: 8px;
  padding: 0px 10px;
  div {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    font-size: 14px;
  }

  .sticky {
    position: sticky;
    left: 0;
    background: white;
    z-index: 1;
    background: #f5fbfd;
    padding-left: 10px;
  }
`;
