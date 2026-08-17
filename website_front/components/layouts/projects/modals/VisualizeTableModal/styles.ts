import styled from "styled-components";
import Modal from "../../../../global/common/Modal";

export const Wrapper = styled(Modal)`
  & > div:last-child {
    width: 592px !important;
  }

  @media (max-width: 600px) {
    & > div:last-child {
      width: 100% !important;
    }
  }
`;
