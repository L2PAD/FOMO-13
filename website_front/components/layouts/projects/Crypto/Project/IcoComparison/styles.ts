import styled from "styled-components";

export const Wrapper = styled.div`
  & .info {
    button {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
`;

export const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  h2 {
    margin-bottom: 0px;
  }
`;

export const RaisedWrapper = styled.div`
  position: absolute;
  top: 24px;
  left: -110px;

  & .performance-modal {
    min-width: 200px;
    div {
      font-size: 12px !important;
      line-height: 12px;
    }
  }

  & .roi-modal {
    min-width: 220px;
    padding: 8px;
    div {
      font-size: 12px !important;
      line-height: 12px;
      text-align: left;
      font-weight: 400 !important;
    }

    span {
      font-weight: 600 !important;
    }
  }
`;
