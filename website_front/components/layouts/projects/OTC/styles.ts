import styled from "styled-components";
import Typography from "../../../global/common/Typography";

export const NavigationWrapper = styled.div``;

export const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 20px;
  width: 100%;

  @media (max-width: 767px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
`;
export const PageDescriptionWrapper = styled.div`
  width: 100%;

  .head {
    display: flex;
    align-items: center;
    flex-direction: row;
    gap: 16px;
    justify-content: space-between;

    .deal-switch {
      max-width: 238px;
      width: 100%;
      background: #f9f9f9;
      padding: 4px;
      border-radius: 8px;


      & > div {
        width: 100%;
        text-align: center;

        
      }

      
    }

    @media (max-width: 467px) {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;
export const PageDescription = styled(Typography)`
  line-height: 26px;
  font-size: 15.5px;
  color: var(--main-black);
  font-weight: var(--font-weight-regular);

  white-space: normal !important;
  span {
    color: var(--color-text-primary);
  }
  a {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-primary);
    margin-left: 10px;
    svg {
      width: 16px;
      margin-bottom: -5px;
    }
  }
  @media (max-width: 767px) {
    font-size: 14px;
    line-height: 16px;
    font-size: 18px;
    line-height: 21px;
    a {
      font-size: 14px;
      line-height: 16px;
    }
  }
`;
export const PageWrapper = styled.div`
  padding: 16px 36px;
  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
`;
export const PageContent = styled.div`

`;
export const TabsContentWrapper = styled.div`
  margin-top: 20px;
  position: relative;
  ​ .deal {
    display: block;
    margin-top: 8px;
    font-size: 14px;
    color: var(--color-text-muted);
    ​ b {
      color: var(--color-text-primary);
    }
  }
`;
export const SharePageWrapper = styled.div`
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 32px 24px;
  background: white;
  border-radius: 8px;
`;
export const SharePageHeader = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
  ​ & > div:last-child {
    & > p {
      font-weight: var(--font-weight-semibold);
      font-size: 32px;
      line-height: 39px;
      margin-bottom: 4px;
    }
    & > div {
      display: flex;
      gap: 10px;
      align-items: center;
      ​ p {
        font-weight: var(--font-weight-regular);
        font-size: 18px;
        line-height: 21px;
        color: var(--color-text-muted);
        margin-right: 10px;
      }
      ​ div {
        background: #f8f8f9;
        border-radius: 99px;
        width: max-content;
        padding: 5px 8px;
      }
    }
  }
`;
export const SharePageData = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
`;
export const SharePageText = styled.p`
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  span {
    color: var(--color-text-muted);
  }
`;
export const PaginationWrapper = styled.div``;
export const FilterWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;

  & .create-deal{
    height: 35px;
    border-radius: 8px;
  }

  & .search-deals{
    min-width: 190px;
    @media (max-width:1720px) {
      max-width: 190px;
    }
    input{
      font-size: 14px;
      height: 38px;

      &::placeholder{
        font-size: 14px;
      }
    }
  }

  .right {
    display: flex;
    flex-direction: row;
    gap:4px;
    align-items: center;

    button {
      font-size: 12px;
    }

    @media (max-width: 1120px) {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
      width: 100%;
      gap: 8px;
    }
  }

  .left {
    overflow: visible;
    width: fit-content;
  }

  .button > button {
    padding: 8px 16px;
    border: 1px solid var(--color-primary);
    border-radius: 6px;
  }

  @media (max-width: 767px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .payment-dropdown {
    min-width: 295px;
  }
  .sort-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    min-width: 141px;
    height: 32px;
    border: 1px solid #f0f2f5;
    border-radius: 8px;
    justify-content: space-between;
    font-size: 14px;
    padding: 2px 0 2px 8px;

    select {
      font-weight: var(--font-weight-semibold);
    }

    &.big {
      min-width: 295px;
    }

    input {
      border: none;
      outline: none;
      font-size: 14px;
    }

    .sort {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 4px;
    }
  }

  
    @media (max-width: 767px) {
      width: 100%;
    }
`;

export const Select = styled.select`
  border: none;

  &.big {
    width: 100%;
  }
`;


export const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

`

export const PageHeaderWrapper = styled.div`
  display: flex;
  align-items: center; 
  justify-content: space-between;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 2px 2px 8px 0px #00053014;
  transition: box-shadow 0.3s ease;

  & .info-button{
    margin-top: 4px;
    display: flex;

    svg{
      width:16px;
      height:16px;
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
`

export const PageHeaderWrapperLeft = styled.div`
  display: flex;
  align-items: center; 
  gap: 8px;
  max-width: 100%;

  & .left{
      display: flex;
      align-items: center; 
      gap: 4px;
      width: 100%;
  }

  & .deal-switch{
    div{
      height: 38px;
      font-size:14px;
    }
  }

  @media (max-width: 1120px) {
    flex-direction: column-reverse;
    justify-content: center;
    gap: 12px;
      width: 100%;

  }
`

export const PageDesciptionWrapper = styled.div`
  position: relative;

  h2{
    margin-bottom: 4px;
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    color: var(--main-black);
  }

  & .gray-description{
    position: absolute;
    top: 30px;
    right: -220px;
    z-index:1;
    min-width: 420px;
    & .description-modal-text{
      font-size: 12px;
    }

    @media (max-width: 1204px) {
      right: -20px;
      min-width: 50vw;
    }
  }

  &.switch-description{
    & .gray-description{
      top: 10px;
    }
  }
`

export const BazzarSwitchWrapper = styled.div`
  display: flex;
  align-items:  center;
  height: 100%;
  button{
    display: flex;
    align-items: center;  
    gap: 8px;
    padding: 4px 16px;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    opacity: 0.6;
    color: var(--main-gray);
    transition: opacity 0.3s ease;
    height: 38px;
    &:hover{
      opacity: 0.9;
    }
    &.sell{
      color: var(--main-red);
    }
    &.buy{
      color: var(--main-green);
    }
    &.active{
      border-radius: 8px;
      opacity: 1;
      &.buy{
        color: var(--main-green);
        border: 1px solid var(--main-green);
      }
       &.sell{
        color: var(--main-red);
        border: 1px solid var(--main-red);
      }
    }
    img{
      width: 20px;
      height: 20px;
    }

  }

    @media (max-width: 1120px) {
        width: 100%;

      button{
        width: 100%;
      }
    }
  & .button-wrapper{
    position: relative;

     @media (max-width: 1120px) {
        width: 100%;

      button{
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 767px) {
        button{
          padding: 4px 8px;
        }
    }
  }
`

export const MobilePageHeaderWrapper = styled.div`
  display: none;

  @media (max-width: 767px) {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 10px 0;
  }
`;

export const MobileHeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  .deal-switch {
    border-radius: 8px;
    padding: 2px;
  gap: 0px;
    > div {
      padding: 12px 18px;
      font-size: 14px;
      line-height: 16px;
    }
  }
`;

export const MobileHeaderTitle = styled.h2`
  margin: 0;
  font-weight: var(--font-weight-semibold);
  font-size: 28px;
  line-height: 48px;
  color: var(--color-text-primary);

  @media (max-width: 420px) {
    font-size: 24px;
    line-height: 44px;
  }
`;

export const MobileHeaderDescription = styled.p<{ expanded: boolean }>`
  margin: 0;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 20px;
  color: var(--main-black);

  display: -webkit-box;
  -webkit-line-clamp: ${({ expanded }) => (expanded ? 8 : 2)};
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const MobileSeeMoreButton = styled.button`
  border: none;
  background: none;
  color: #049bf2;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;
  padding: 0;
`;

export const MobileSearchRow = styled.div<{ adOpen: boolean }>`
  display: grid;
  grid-template-columns: ${({ adOpen }) => (adOpen ? "46px 1fr" : "minmax(0, 1fr) auto")};
  align-items: center;
  gap: 8px;
`;

export const MobileSearchWrapper = styled.div<{ collapsed: boolean }>`
  position: relative;
  height: 38px;
  border-radius: 8px;
  background: #f8f8f9;
  overflow: hidden;
  display: flex;
  align-items: center;
  cursor: ${({ collapsed }) => (collapsed ? "pointer" : "text")};
  transition: all 0.3s ease;
  width: ${({ collapsed }) => (collapsed ? "46px" : "100%")};

  svg {
    position: absolute;
    left: ${({ collapsed }) => (collapsed ? "50%" : "12px")};
    top: 50%;
    transform: ${({ collapsed }) =>
    collapsed ? "translate(-50%, -50%)" : "translateY(-50%)"};
    width: 16px;
    height: 16px;
    pointer-events: none;
  }

  input {
    width: ${({ collapsed }) => (collapsed ? "0" : "100%")};
    opacity: ${({ collapsed }) => (collapsed ? 0 : 1)};
    border: none;
    outline: none;
    background: transparent;
    height: 100%;
    padding: ${({ collapsed }) => (collapsed ? "0" : "0 12px 0 36px")};
    font-size: 14px;
    color: var(--color-text-primary);
    transition: all 0.25s ease;
    pointer-events: ${({ collapsed }) => (collapsed ? "none" : "auto")};
  }
`;

export const MobileAdWrapper = styled.div<{ adOpen: boolean }>`
  width: 100%;
  grid-column: ${({ adOpen }) => (adOpen ? "2 / -1" : "auto")};
  display: flex;
  justify-content: ${({ adOpen }) => (adOpen ? "flex-start" : "flex-end")};

  & > div {
    width: ${({ adOpen }) => (adOpen ? "76vw" : "auto")};
    max-width: ${({ adOpen }) => (adOpen ? "76vw" : "fit-content")};
  }
`;

export const MobileActionSwitchWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  img {
    width: 20px;
    height: 20px;
  }

  button {
    border: none;
    background: transparent;
    border-radius: 8px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 1;
    color: var(--color-text-muted);
  }

  button.buy {
    color: var(--main-green);
  }

  button.sell {
    color: var(--main-red);
  }

  button.active.buy {
    border: 1px solid var(--main-green);
    background: var(--color-white);
  }

  button.active.sell {
    border: 1px solid var(--main-red);
    background: var(--color-white);
  }
`;

export const MobileControlsRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 46px 46px;
  gap: 8px;
  align-items: center;
  width: 100%;

  .mobile-control {

    display: flex;
    align-items: center;
    justify-content: center;
   
    & .mobile-icon-button {
        width: 46px;
    height: 38px;
    background: #f8f8f9;
    border-radius: 8px;
    
    }
  }

  .mobile-control-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
  }

  .mobile-control-actions .contact-btn {
    width: 46px;
    height: 38px;
    padding: 0;
    justify-content: center;
  }

  .mobile-control-actions .create-deal-mobile {
    flex: 1;
    height: 38px;
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    padding: 0 12px;
  }

  .mobile-icon-button {
    width: 100%;
    height: 100%;
    padding: 0;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .mobile-icon-button .sort-trigger {
    gap: 0;
  }

  .mobile-icon-button svg {
    width: 14px;
    height: 14px;
    margin: 0;
  }

  .mobile-icon-button > p,
  .mobile-icon-button > span,
  .mobile-icon-button .sort-trigger span,
  .mobile-icon-button .sort-trigger p {
    display: none;
  }

  .mobile-icon-button .sort-dropdown,
  .mobile-settings-dropdown {
    min-width: 95vw;
    right: -0px;
    left: auto;
  }

  @media (max-width: 480px) {
    .mobile-icon-button .sort-dropdown,
    .mobile-settings-dropdown {
      right: -65px;
    }
  }

  .mobile-full-width {
    grid-column: 1 / -1;
    width: 100%;
  }
`;

