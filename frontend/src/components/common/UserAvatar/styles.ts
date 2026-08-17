import styled from "styled-components";

const getSize = (size: 'xSmall' | 'small' | 'medium' | 'big' | 'giant' | 'project') => {
    switch (size) {
        case 'project':
            return '84px'
        case 'xSmall':
            return '20px';
        case 'small':
            return '32px';
        case 'medium':
            return '64px';
        case 'big':
            return '80px';
        case 'giant':
            return '120px';
        default:
            return '20px';
    }
}

const getColor = (variant: 'default' | 'warn' | 'success' | 'error' | 'none') => {
    switch (variant) {
        case 'default':
            return 'white';
        case 'warn':
            return 'var(--color-warning)';
        case 'success':
            return 'var(--color-primary)';
        case 'error':
            return 'var(--color-danger)';
        case 'none':
            return 'transparent';
        default:
            return 'transparent';
    }
}

const getBorder = (size: 'xSmall' | 'small' | 'medium' | 'big' | 'giant' | 'project') => {
    switch (size) {
        case 'project':
            return 0;
        case 'xSmall':
            return 1;
        case 'small':
            return 1;
        case 'medium':
            return 3;
        case 'big':
            return 3;
        case 'giant':
            return 3;
        default:
            return 1;
    }
}

export const AvatarWrapper = styled.div<{ size: 'xSmall' | 'small' | 'medium' | 'big' | 'giant' | 'project'}>`
  width: ${({ size }) => getSize(size)};
  height: ${({ size }) => getSize(size)};
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  
  img {
    object-fit: cover;
    width: ${({size}) => getSize(size)};
    height: ${({size}) => getSize(size)};
  }
`

export const Avatar = styled.img<{ size: 'xSmall' | 'small' | 'medium' | 'big' | 'giant' | 'project', variant: 'default' | 'warn' | 'success' | 'error' | 'none' }>`
  width: 100%;
  border: ${({ size, variant }) => ` ${getBorder(size)}px solid ${getColor(variant)} `};
  border-radius: ${({ size, variant }) => size === 'project' ? '16px' : '100px'};
`

export const RatingWrapper = styled.span<{ size: 'xSmall' | 'small' | 'medium' | 'big' | 'giant' | 'project', variant: 'default' | 'warn' | 'success' | 'error' | 'none' }>`
  position: absolute;
  font-size: ${({ size }) => size === 'giant' ? '19px' : '14px'};
  font-weight: var(--font-weight-semibold);
  line-height: 17px;
  color: white;
  background: ${({ variant }) => getColor(variant)};
  border-radius: 99px;
  width: ${({ size }) => size === 'giant' ? 32 : 24}px;
  height: ${({ size }) => size === 'giant' ? 32 : 24}px;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  right: ${({ size }) => size === 'giant' ? -6 : -8}px;
`