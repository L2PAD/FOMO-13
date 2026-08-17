import styled from 'styled-components';

export type ModalVariant = 'small' | 'medium' | 'big' | 'editor' | 'small-medium' | 'cart' | 'deal' | 'filter' | 'project';

interface Props {
    variant: ModalVariant;
}

const getSize = ({ variant }: Props) => {
  switch (variant) {
    case 'small':
      return 362
    case 'cart':
      return 400
    case 'deal':
      return 480
    case 'filter':
      return 1120
    case 'medium':
      return 580
    case 'big':
      return 800
    case 'editor':
      return 1180
    case 'project':
      return 950
    case 'small-medium':
      return 440
    default:
      return 360
  }
}


export const ModalWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 99999999999;
`

export const Overlay = styled.div` 
  position: fixed;
  background: rgba(0, 0, 0, 0.5);
  width: 100vw;
  height: 100vh;
  z-index: 99999;
  top: 0;
  left: 0;
`

export const ModalStyle = styled.div<{variant: ModalVariant}>`
  width: ${({variant}) => getSize( {variant})}px !important;
  max-width: calc(100vw - 32px);
  box-sizing: border-box;
  background: white;
  border: 1px solid rgba(83, 98, 124, 0.07);
  box-shadow: 4px 4px 0 #EEE;
  border-radius: 8px;
  height: max-content;
  max-height: calc(100vh - 32px);
  overflow:auto;
  z-index: 999999;

  &.chat-modal {
    width: calc(100vw - 48px) !important;
    max-width: calc(100vw - 48px);
    height: calc(100vh - 40px);
    max-height: calc(100vh - 40px);
    border-radius: 14px;
    box-shadow: 0 24px 80px rgba(13, 24, 56, 0.26);
    border: 1px solid rgba(83, 98, 124, 0.14);
    overflow: hidden;
  }

  &.chat-modal > div {
    height: 100%;
    padding: 0;
  }

  &.chat-modal.fullscreen {
    width: 100vw !important;
    max-width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    border: none;
    box-shadow: none;
  }
`

export const InternalWrapper = styled.div`
  padding: 16px;
`

export const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export const Title = styled.p`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  margin: 0;
  padding: 0;
`

export const UserAvatar = styled.img`
  width: 32px;
  border-radius: 100px;
`
