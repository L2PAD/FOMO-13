import {FC} from 'react';
import {Label,Span,Div} from './styles';

interface Props {
    value: string;
    type: string;
    label?: string;
}

const ValueWithLabel: FC<Props> = ({label, value, type}) => {
    if(type === 'rating'){
        return (
            <div>
                {label && <Label>{label}</Label>}
                <Div>
                    {value}
                    <Span>/100</Span>
                </Div>
            </div>
        );
    }

    return (
        <div>
            {label && <Label>{label}</Label>}
            <Div>
                {value}
                %
            </Div>
        </div>
    );
};

export default ValueWithLabel;