import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";
import Typography from "../../../../../global/common/Typography";

export const Wrapper = styled(BaseCard)`
  padding: 0 !important;
  width: 228px !important;
  position: relative;
  border-radius: 16px;
  background-color: var(--color-white);
  &&:hover {
    .buttons {
      display: flex;
    }
  }

  .buttons {
    display: none;
    width: 100%;
    padding: 12px;
    gap: 12px;

    button {
      width: 100%;

      &.secondary {
        background-color: var(--color-primary)1a;
        color: var(--color-primary);
      }
    }
  }
`;
export const ImageWrapper = styled.div`
  position: relative;

  img {
    width: 100%;
    height: 157px;
    object-fit: cover;
    border-radius: 16px 16px 0 0;
  }
`;

export const ImageTagWrapper = styled.div`
  position: absolute;
  width: 100%;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  padding: 12px;
`;

export const Tag = styled.div`
  padding: 4px 10px;
  background: var(--color-white);
  border-radius: 8px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 14px;
  color: #8a53ff;
  display: flex;
  align-items: center;
`;

export const TagCircle = styled.div`
  width: 25px;
  height: 25px;
  background: var(--color-white);
  border-radius: 99px;
`;

export const NumberTag = styled.div`
  left: 12px;
  bottom: 18px;
  position: absolute;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: var(--color-white);
  padding: 4px 10px;
`;

export const DescriptionWrapper = styled.div`
  padding: 12px;
  width: 100%;
`;

export const Title = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 24px;
  color: var(--color-text-primary);
  margin-bottom: 7px !important;
`;

export const PriceWrapper = styled.div`
  display: flex;
  justify-content: space-between;

  span {
    display: f;
    font-weight: var(--font-weight-regular);
    font-size: 12px;
    line-height: 16px;
    color: var(--color-text-muted);

    b {
      color: #0d0f2b;
    }
  }
`;

export const HiddenImage = styled.div`
  width: 228px;
  height: 225px;
  background: rgba(115, 128, 148, 0.12);
  border-radius: 8px 8px 0 0;
`;

export const HiddenContent = styled.div`
  background: rgba(224, 224, 224, 0.12);
  backdrop-filter: blur(7.5px);
  border-radius: 8px;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  font-weight: var(--font-weight-semibold);
  font-size: 64px;
  line-height: 77px;
  color: rgba(115, 128, 148, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
`;
