import React, {FC} from 'react';
import {HeaderWrapper, InternalWrapper, ModalStyle, ModalVariant, ModalWrapper, Overlay, Title} from './styles';
import CloseIcon from '../Icons/close_icon';
import Button from '../button';

export interface ModalInterface {
    className?: string;
    variant?: ModalVariant;
    title: string;
    onClose: () => void;
    children: any;
    isTitle?: boolean;
}

const Modal: FC<ModalInterface> = (
    {
        className,
        variant = 'small',
        title,
        onClose,
        children,
        isTitle = true,
    }
) => {

    return (
        <ModalWrapper>
            <Overlay onClick={onClose}/>
            <ModalStyle variant={variant} className={className}>
                <InternalWrapper>
                    {isTitle && <HeaderWrapper>
                        <Title>{title}</Title>
                        <Button type='empty' onClick={onClose}>
                            <CloseIcon/>
                        </Button>
                    </HeaderWrapper>}
                    {children}
                </InternalWrapper>
            </ModalStyle>
        </ModalWrapper>
    );
};

export default Modal;