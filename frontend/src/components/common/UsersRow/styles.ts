import styled from "styled-components";

export const RowWrapper = styled.div`
  display: flex;
`

export const AvatarItem = styled.div`
  &:not(:first-child) {
    margin-left: -6px;
  }
`