import styled from "styled-components";
import BaseCard from "../common/BaseCard";
import Typography from "../common/Typography";

export const Wrapper = styled(BaseCard)`
  padding: 0 !important;
  width: 228px !important;
  position: relative;
`;
export const ImageWrapper = styled.div`
  position: relative;
  width: 100%;

  img {
    width: 100%;
    height: auto;
  }
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

export const DescriptionWrapper = styled.div`
  padding: 12px;
  width: 100%;
`;

export const Title = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-primary);
  margin-bottom: 7px !important;
`;

export const PriceWrapper = styled.div`
  display: flex;
  gap: 10px;

  button {
    background: var(--color-primary-soft);
    border-radius: 8px;
    padding: 8px 10px;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-primary);
    border: none;

    &:last-child {
      background: none;
    }
  }
`;

export const HiddenImage = styled.div`
  width: 100%;
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
