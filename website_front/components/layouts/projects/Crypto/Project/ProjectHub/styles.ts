import styled from "styled-components";

export const Wrapper = styled.div`
  width: 100%;
`;

export const ProjectImages = styled.div`
  width: 100%;
  display: flex;
  gap: 20px;
  max-height: 490px;

  img {
    width: 100%;
    height: 490px;
    border-radius: 12px;
    object-fit: cover;
  }
`;

export const ImagesItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;

  & .img-item {
    position: relative;
    width: 100%;

    & .remove-btn {
      position: absolute;
      top: 12px;
      right: 12px;
    }
  }

  & .add-btn {
    max-width: fit-content;
  }

  & .upload-wrapper {
    max-width: 100% !important;
  }
`;
