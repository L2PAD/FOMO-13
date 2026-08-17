import styled from "styled-components";
import Modal from "../../../../global/common/Modal";

export const Wrapper = styled(Modal)`
  & > div:last-child {
    width: 1200px !important;
  }

  @media (max-width: 1200px) {
    & > div:last-child {
      width: 100% !important;
    }
  }
`;
