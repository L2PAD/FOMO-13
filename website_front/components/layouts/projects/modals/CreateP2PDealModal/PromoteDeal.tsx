import React, { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { CheckIcon } from '../../../../global/Icons'
import DescriptionComponent from '../../../../global/common/DescriptionComponent'

const Content = styled.div`
    position: relative;

    .tooltip-content {
 
    }

    & .gray-description{
       position: absolute;
       z-index:1;
       top: 50px;
       & .description-modal-text{
        font-size: 12px;

        span{
            font-weight: var(--font-weight-semibold);
        }
       }
    }
`

const smoothGradientFlow = keyframes`
    0%, 100% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
`

const Wrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    margin-bottom: 24px;
    gap: 4px;
    
    background: linear-gradient(
        90deg,
        #0FA4E9,
        #20A7EB,
        #38ADEE,
        #48B0EE,
        #5AB8F0,
        #7478ef,
        #6266F1,
        #696ef3,
        #38ADEE,
        #20A7EB,
        #0FA4E9
    );
    
    background-size: 400% 400%;
    border-radius: 8px;
    padding: 6.5px 12px;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 20px;
    color: #FFFFFF;
    cursor: pointer;
    transition: all 0.3s ease;
    user-select: none;
    
    animation: ${smoothGradientFlow} 10s ease infinite;

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 15px rgba(98, 102, 241, 0.3);
    }

    &:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(98, 102, 241, 0.2);
    }
    
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`

const Label = styled.span`
    margin-right: 8px;
    font-weight: var(--font-weight-semibold);
    font-size: 12px;
    color: #FFFFFF;
    padding: 4px 8px;
    background: #48B0EE;
    border-radius: 6px;
`

const Checkbox = styled.div`
    margin-left: auto;
    width: 20px;
    height: 20px;
    border: 2px solid #FFFFFF;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;

    svg{
        width: 12px;
        height: 12px;
    }

    &.checked {
        background: #FFFFFF;
        
        &::after {
            content: '';
            color: #6266F1;
            font-size: 14px;
            font-weight: var(--font-weight-semibold);
        }
    }
`

const Text = styled.div`
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    color: #FFFFFF;
`

interface PromoteDealProps {
    label?: string;
    text?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const PromoteDeal: React.FC<PromoteDealProps> = ({
    label = "Add",
    text = "Promote Deal",
    checked: controlledChecked,
    onChange
}) => {
    const [isHover, setIsHover] = useState<boolean>(false);
    const [internalChecked, setInternalChecked] = useState<boolean>(false)

    const isControlled = controlledChecked !== undefined
    const checked = isControlled ? controlledChecked : internalChecked

    const handleClick = () => {
        const newValue = !checked

        if (!isControlled) {
            setInternalChecked(newValue)
        }

        if (onChange) {
            onChange(newValue)
        }
    }

    return (
        <Content>
            <Wrapper
                onMouseEnter={() => setIsHover(true)}
                onMouseLeave={() => setIsHover(false)}
                tabIndex={0} onClick={handleClick}>
                <Label>{label}</Label>
                <Text>{text}</Text>
                <Checkbox className={checked ? 'checked' : ''}>
                    {checked && <CheckIcon fill='#6266F1' />}
                </Checkbox>

            </Wrapper>
            <DescriptionComponent
                isDate={false}
                className='gray-description'
                isVisible={isHover}
                date={new Date()}
                text="Promoting your deal boosts visibility among potential buyers and increases the likelihood of a successful transaction. <br/><span>This option includes a 5% additional commission.</span>"
            />
        </Content>
    )
}

export default PromoteDeal