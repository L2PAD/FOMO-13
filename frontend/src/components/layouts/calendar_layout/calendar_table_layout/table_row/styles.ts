import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  padding: 8px 16px;
  align-items: center;
  background: var(--color-white);
  border: 1px solid rgba(83, 98, 124, 0.07);
  box-shadow: 4px 4px 0 #EEEEEE;
  border-radius: 8px;
  margin-bottom: 10px;
`

export const ProjectWrapper = styled.div`
  width: 210px;
  display: flex;
  gap: 10px;
  align-items: center;
  
  img {
    width: 32px;
    height: 32px;
    border-radius: 100px;
  }
`
export const ProjectTitleWrapper = styled.div`
  display: flex;
  
  p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    margin-right: 4px;
  }
  span {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
    text-align: center;
    color: var(--color-primary);
  }
`
export const ProjectDescription = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
`
export const StatusWrapper = styled.div`
  width: 130px
`
export const EventWrapper = styled.div`
  width: 175px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
`
export const DateWrapper = styled.div`
  width: 202px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
`
export const TimeWrapper = styled.div`
  width: 313px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  display: flex;
  gap: 10px;
  
  div {
    display: flex;
    flex-direction: column;
  }
  
  span {
    font-weight: var(--font-weight-semibold);
    font-size: 12px;
    line-height: 14px;
    color: var(--color-text-muted);
  }
`

export const RatingWrapper = styled.div`
  width: 163px;
`

export const ActionsWRapper = styled.div`
  display: flex;
  gap: 16px
`