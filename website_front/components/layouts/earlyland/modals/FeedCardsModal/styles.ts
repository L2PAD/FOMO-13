import styled from "styled-components";
import Modal from "../../../../global/common/Modal";

export const Wrapper = styled(Modal)`
  & > div:last-child {
    width: 320px !important;
  }

  @media (max-width: 350px) {
    & > div:last-child {
      width: 100% !important;
    }
  }
`;

export const ContentWrapper = styled.div`
  max-height: 600px;
  overflow-y: auto;
`;
