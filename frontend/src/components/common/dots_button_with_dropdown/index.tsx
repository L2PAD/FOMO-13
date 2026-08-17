import React, {FC, useState} from 'react';
import Button from '../button';
import VerticalDotsIcon from '../Icons/vertical_dots_icon';
import {DropdownWrapper, Wrapper} from './styles';

interface Props {
    items: {title: string, onClick: () => void}[]
}

const DotsButtonWithDropdown: FC<Props> = ({items}) => {
    const [hide, setHide] = useState(true)

    return (
        <Wrapper onBlur={(e) => {
            setHide(true)
        }}>
            <Button
                onClick={() => {
                    setHide(state => !state)
                }}
                type='empty'
            >
                <VerticalDotsIcon />
            </Button>
            <DropdownWrapper hide={hide}>
                {items.map(({title, onClick}, i) => {
                    return (
                        <div
                            key={i}
                            onClick={() => {
                                onClick()
                                setHide(true)
                            }}>
                            {title}
                        </div>
                    )
                })}
            </DropdownWrapper>
        </Wrapper>
    );
};

export default DotsButtonWithDropdown;