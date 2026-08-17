import styled from 'styled-components';
import Typography from '../../../../common/typography';


export const TimerBlockWrapper = styled.div`
  margin-top: 24px;
  display: flex;
  align-items: center;
  flex-direction: column;
  position: relative;
  
  img {
    width: 594px;
    height: 330px;
    border-radius: 16px;
  }

  .dots {
    display: flex;
    gap: 6px;
    padding: 8px;

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #FF507D33;
    }

    .active {
      background: #FF507D;
    }
  }
`

export const TimerWrapper = styled.div`
  position: absolute;
  background: var(--color-white);
  border-radius: 16px;
  padding: 10px;
  left: 40px;
  bottom: 36px;
  width: 264px;

  @media(max-width: 666px) {
    left: 40px;
  }
`

export const Table = styled.div`
  width: 1200px;
  padding: 0 !important;
  box-shadow: 4px 4px 10px 0px #EEEEEE !important;
  border-radius: 16px !important;
  overflow-x: auto;

  .header {
    width: 1200px;
    display: flex;
    background-color: #F5F9FD;
    color: var(--color-text-muted);
    font-size: 12px;
    padding: 10px;
    border-bottom: 1px solid #F5F9FD;
    border-radius: 16px 16px 0 0;
  }

  .row {
    width: 1200px;
    display: flex;
    padding: 10px;
    border-bottom: 1px solid #F5F9FD;
    font-size: 14px;
    align-items: center;
    
    p {
      font-weight: var(--font-weight-semibold);
    }

    .project {
      display: grid;
      grid-template-columns: 70px 1fr;
      align-items: center;


      div {
        padding: 0 !important;
      }

      img {
        width: 32px;
        height: 32px;
        border-radius: 8px;
      }

      span {
        color: var(--color-text-muted);
      }
    }

    .stats {
      p {
        background: var(--color-info);
        color: white;
        border-radius: 8px;
        font-size: 12px;
        padding: 4px 8px;
        width: max-content;
      }
    }
  }

  .header p, .row div {
      &:first-child {
        width: 400px;
        padding-left: 15px;
      }
      &:nth-child(2) {
        width: 200px;
      }
      &:nth-child(3) {
        width: 150px;
      }
      &:nth-child(4) {
        width: 200px;
      }
      &:nth-child(5) {
        width: 200px;
      }
    }
`

export const TimerTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-text-primary);
`

export const TimerSecondTitle = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  color: var(--color-text-muted);
  margin-bottom: 4px !important;
`

export const TimerValue = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 12px;
  color: #277AD2;
  margin-bottom: 16px;
`

export const TimerButton = styled.a`
  max-width: fit-content;
  background: #FF507D;
  padding: 6px 16px;
  border-radius: 99px;
  font-size: 16px;
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
`

export const DeleteBtn = styled.div`

`

export const ButtonsWrapper = styled.div`
  position: absolute;
  top: 15px;
  right: 15px;

  display: flex;
  gap:12px;
`