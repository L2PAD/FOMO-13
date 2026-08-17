import styled from 'styled-components';

export const Wrapper = styled.button`
  display: flex;
  padding: 8px 16px;
  align-items: center;
  background: var(--color-white);
  border: 1px solid rgba(83, 98, 124, 0.07);
  box-shadow: 4px 4px 0 #EEEEEE;
  border-radius: 8px;
  margin-bottom: 10px;
  width:100%;
  transition: all 0.3s ease;
  &:hover{
    opacity: 0.9;
    background: #8080802f;
  }
  &:active{
    opacity: 0.7;
    background: #8080802f;
  }
`

export const ProjectWrapper = styled.div`
  width: 230px;
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
export const EventWrapper = styled.a`
  width: 175px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
  &:hover{
    opacity: 0.9;
    background: #8080802f;
  }
  &:active{
    opacity: 0.7;
    background: #8080802f;
  }
`
export const DateWrapper = styled.div`
  width: 202px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;
`
export const TimeWrapper = styled.div`
  width: 130px;
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
  position: absolute;
  top: 8px;
  right: 5px;
  display: flex;
  align-items: center;
  gap: 16px;
`

export const PointsWrapper = styled.div`
  font-weight: var(--font-weight-semibold);
`

export const TableItemWrapper = styled.div`
  position: relative;
`

export const TaskTitleBlock = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  text-align: left;
`;

export const TaskMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

export const TaskMetaBadge = styled.span<{ $prime?: boolean }>`
  border-radius: 999px;
  padding: 2px 6px;
  color: ${({ $prime }) => ($prime ? '#8a6500' : '#027e66')};
  background: ${({ $prime }) =>
    $prime ? 'rgba(255, 199, 4, 0.18)' : 'rgba(4, 165, 132, 0.11)'};
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
`;
