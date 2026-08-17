import styled from "styled-components";

interface Props {
    type?:any
    variant: 'default' | 'success' | 'warn' | 'alert';
}

const getColor = ({variant}: Props) => {
    switch (variant) {
    case 'default':
        return 'rgba(115, 128, 148, 0.5)';
    case 'warn':
        return 'rgba(244, 195, 19, 0.05)';
    case 'alert':
        return 'rgba(228, 39, 54, 0.05)';
    case 'success':
        return 'rgba(5, 201, 161, 0.05)';
    default:
        return 'rgba(5, 201, 161, 0.05)';
    }
}

const getTextColor = ({variant}: Props) => {
    switch (variant) {
    case 'default':
        return 'rgba(115, 128, 148)';
    case 'warn':
        return 'rgba(244, 195, 19)';
    case 'alert':
        return 'rgba(228, 39, 54)';
    case 'success':
        return 'rgba(5, 201, 161)';
    default:
        return 'rgba(5, 201, 161, 0.05)';
    }
}

export const TagWrapper = styled.div<{variant: 'default' | 'success' | 'warn' | 'alert',type:any | 'project'}>`
  background: ${({variant}) => getColor({variant})};
  color: ${({variant}: Props) => getTextColor({variant})};
  font-size: 12px;
  font-weight: var(--font-weight-regular);
  line-height: 14px;
  border-radius: 8px;
  padding: 4px 6px;
  width: max-content;
`