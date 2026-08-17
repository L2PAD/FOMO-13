import React, { FC, ReactNode } from "react";
import styled from "styled-components";
import { useTranslation } from "i18n";

const Wrapper = styled.div`
  min-width: 190px;
  width: 100%;
  min-height: 100%;
  padding: 20px 10px;
  background: #f5fbfd;
  border-radius: 16px;
  display: flex;
  flex-direction: column;

  &.shadow-card {
    background: #ffffff;
    border: 1px solid var(--Stroke, #F0F2F5);
    box-shadow: 2px 2px 8px 0px #00053014;
  }

  @media (max-width: 1400px) {
    padding: 20px 8px;
  }

  @media (max-width: 1024px) {
    min-width: 160px;
    padding: 16px 8px;
  }

  @media (max-width: 768px) {
    min-width: 140px;
    padding: 14px 8px;
    border-radius: 12px;
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }

  @media (max-width: 480px) {
    min-width: 120px;
    padding: 12px 6px;
    border-radius: 10px;

    &.sp500 {
      height: 153px !important;
    }
  }
`;

const Title = styled.h3`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  margin-bottom: 12px;
  text-align: start;

  @media (max-width: 768px) {
    font-size: 15px;
    margin-bottom: 10px;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    margin-bottom: 8px;
  }
`;

interface IProps {
  title: string;
  children: ReactNode;
  className?: string;
}

const StatisticsCard: FC<IProps> = ({ title, children, className }) => {
  const { translateText } = useTranslation();

  return (
    <Wrapper className={className}>
      {title ? <Title>{translateText(title)}</Title> : <></>}
      {children}
    </Wrapper>
  );
};

export default StatisticsCard;
