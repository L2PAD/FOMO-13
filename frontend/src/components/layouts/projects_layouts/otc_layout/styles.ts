import styled from 'styled-components';
import Typography from '../../../common/typography';

export const PageDescriptionWrapper = styled.div`
  margin-top: 16px;
`

export const PageDescription = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 18px;
  line-height: 21px;
  color: var(--color-text-primary);
  white-space: normal !important;
  
  span {
    color: var(--color-text-muted);
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
  
  i {
    cursor: pointer;
    svg path {
      fill: var(--color-info);
    }
  }
  
`

export const PageWrapper = styled.div`
  width: 1204px;
  margin: 27px auto 0;
`
export const PageContent = styled.div`
  margin-top: 24px;
`
export const TabsContentWrapper = styled.div`
  margin-top: 16px;
`