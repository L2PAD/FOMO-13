import React, {FC, ReactNode} from 'react';
import OutlinedButton from './outlined_button';
import EmptyButton from './empty_button';
import BorderedButton from './bordered_button';
import LightFillButton from './light_fill_button';
import FillButton from './fill_button';

interface Props {
    children: ReactNode,
    type?: 'outlined' | 'bordered' | 'fill' | 'default' | 'empty' | 'lightFill',
    onClick: () => void;
    className?: string;
    disabled?:boolean
}

const Button: FC<Props> = ({children, type = 'default', ...props}) => {

    switch (type) {
        case 'outlined':
            return <OutlinedButton {...props}>
                {children}
            </OutlinedButton>
        case 'empty':
            return <EmptyButton {...props}>
                {children}
            </EmptyButton>
        case 'bordered':
            return <BorderedButton {...props}>
                {children}
            </BorderedButton>
        case 'lightFill':
            return <LightFillButton {...props}>
                {children}
            </LightFillButton>
        case 'fill':
            return <FillButton {...props}>
                {children}
            </FillButton>
        default:
            return <OutlinedButton {...props}>
                {children}
            </OutlinedButton>
    }
};

export default Button;