import React, {FC} from 'react';
import {TagWrapper} from "./styles";

export interface TagInterface {
    type?:any | 'project'
    variant: 'default' | 'success' | 'warn' | 'alert';
    label: string;
    className?: string;
}

const Tag: FC<TagInterface> = ({type,variant, label, className}) => {

    return (
        <TagWrapper type={type} variant={variant} className={className}>
            {label}
        </TagWrapper>
    );
};

export default Tag;