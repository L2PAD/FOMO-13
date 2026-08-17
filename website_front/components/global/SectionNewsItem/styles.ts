import styled from "styled-components";
import BaseCard from "../common/BaseCard";
import Typography from "../common/Typography";

export const Wrapper = styled(BaseCard)`
  padding: 20px !important;
  width: 100%;
  height: 100%;
  cursor: pointer;

  @media (max-width: 405px) {
    width: 350px !important;
  }
`;

export const NewsImage = styled.img`
  height: 240px;
  width: 100%;
  object-fit: cover;
  border-radius: 12px;
`;

export const Date = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  color: rgba(7, 11, 53, 0.5);
  margin-bottom: 8px !important;
`;

export const Title = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 29px;
  color: var(--color-text-primary);
  white-space: normal !important;
`;

export const TimeRead = styled.div`
  margin: 20px 0;
  color: var(--color-text-muted);
  font-size: 14px;
`;
