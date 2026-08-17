import React, {FC, useState} from 'react';
import ArrowDownIcon from '../../Icons/arrow_down_icon';
import { IProject } from '../../../hooks/useCreateProject';
import { INft } from '../../../types/global_types';
import loader from '../../../services/loader';
import {DropdownWrapper, InputValue, Label, Wrapper,Item} from './styles';

interface Props {
    name?:string;
    label: string;
    items:  Array<IProject | INft>;
    onChange: (value: IProject | INft) => void;
    project?: IProject | INft | null;
}

const ModalSelectProject: FC<Props> = ({label, items, onChange, project}) => {
    const [isOpen, setIsOpen] = useState(false)

    if(!project) return <></>

    return (
        <Wrapper>
            <Label>
                {label}
            </Label>
            <InputValue active={isOpen} onClick={() => setIsOpen(state => !state)}>
                {project.name || 'ALL'}
                <ArrowDownIcon />
            </InputValue>
            <DropdownWrapper active={isOpen}>
                {items.map((item:any, i) => {
                    if(item === 'ALL'){
                        return (
                            <Item key={i} onClick={() => {
                                onChange(item)
                                setIsOpen(false)    
                            }}>
                                <span className={'all-items'}>{item}</span>
                            </Item>
                        )
                    }
                    return (
                            <Item key={i} onClick={() => {
                                onChange(item)
                                setIsOpen(false)    
                            }}>
                                <img
                                src={loader(String(item.logo) || '')}
                                alt={item.name}
                                />
                                <span>{item.name}</span>
                            </Item>
                    )
                })}
            </DropdownWrapper>
        </Wrapper>
    );
};

export default ModalSelectProject;