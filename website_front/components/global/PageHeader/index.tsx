import React from 'react'
import styled from 'styled-components'


const Wrapper = styled.div`
  display: flex;
  position: relative;
  align-items: center; 
  justify-content: space-between;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 2px 2px 8px 2px #00053014;
  transition: box-shadow 0.3s ease;
  overflow: visible;


  & .info-button{
    margin-top: 4px;
    display: flex;

    svg{
      width:16px;
      height:16px;
    }
  }

  .tooltip-button {
    z-index: 2;

    .tooltip-text {
      z-index: 1200;
    }

    &:hover {
      z-index: 1201;
    }
  }

  & .deal-switch{
    border: 1px solid #f5f5f5ff;
    border-radius: 8px;
    div{
      padding: 10px 24px;

      
      @media (max-width: 575px) {
        padding: 10px 18px;
      }
    }

  }

  @media (max-width: 1120px) {
    flex-direction: column;
      width: 100%;

  }

  @media (max-width: 767px) {
    display: none;
  }

  &.crypto-market-header {
    margin-bottom: 20px;
    flex-direction: row;
    box-shadow: 2px 2px 8px 0px #00053014;

    .tooltip-button .tooltip-text {
      left: 0;
      transform: translate(0, 50%);
      white-space: normal;
      text-align: left;
      max-width: min(360px, calc(100vw - 32px));
    }

    .tooltip-button:hover .tooltip-text {
      transform: translate(0, 5%);
    }

    & .search-section input{
    }

    & .header-right{
      display: flex;
      align-items: center;
      gap: 12px;
      padding-right: 12px;
    }

    & .title-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;

      & .tooltip-button {
        margin-top: 4px;      
      }

      h1 {
        font-size: 32px;
        font-weight: var(--font-weight-semibold);
      }
    }

    & .search-section {
      position: relative;
    }
  }

  &.custom-tab-header {
    margin-bottom: 0;
  }

  &.funding-feed-header {
    margin-bottom: 20px;
    gap: 16px;
    box-shadow: 2px 2px 8px 0px #00053014;

    .tooltip-button .tooltip-text {
      left: 0;
      transform: translate(0, 50%);
      white-space: normal;
      text-align: left;
      max-width: min(360px, calc(100vw - 32px));
    }

    .tooltip-button:hover .tooltip-text {
      transform: translate(0, 5%);
    }

    @media (max-width: 1120px) {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
    }
  }

  &.crypto-projects-header {
    margin-bottom: 20px;
    gap: 16px;
    box-shadow: 2px 2px 8px 0px #00053014;

    .tooltip-button .tooltip-text {
      left: 0;
      transform: translate(0, 50%);
      white-space: normal;
      text-align: left;
      max-width: min(360px, calc(100vw - 32px));
    }

    .tooltip-button:hover .tooltip-text {
      transform: translate(0, 5%);
    }

    @media (max-width: 1120px) {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
    }
  }

  &.buzz-news-header {
    margin-bottom: 20px;
    min-height: 58px;
    gap: 24px;
    flex-direction: row;
    box-shadow: 2px 2px 8px 0px #00053014;

    .tooltip-button .tooltip-text {
      left: 0;
      transform: translate(0, 50%);
      white-space: normal;
      text-align: left;
      max-width: min(360px, calc(100vw - 32px));
    }

    .tooltip-button:hover .tooltip-text {
      transform: translate(0, 5%);
    }

    @media (max-width: 1120px) {
      flex-wrap: wrap;
      align-items: center;
      gap: 14px;
    }

    @media (max-width: 767px) {
      display: flex;
      align-items: stretch;
    }
  }
`

const PageHeader = ({ children, className }: { children?: React.ReactNode, className?: string }) => {
  return (
    <Wrapper className={className}>
      {children}
    </Wrapper>
  )
}

export default PageHeader
