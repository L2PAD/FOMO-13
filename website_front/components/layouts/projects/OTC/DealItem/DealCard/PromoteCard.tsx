import React from 'react'
import styled, { keyframes } from 'styled-components'

const smoothGradientFlow = keyframes`
    0%, 100% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
`

const Wrapper = styled.button<{ isVisible: boolean }>`
    width: 100%;
    margin-left: auto;
    height: 40px;
    text-align: center;
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
    padding: 4px 12px;
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 20px;
    color: #FFFFFF;
    transition: all 0.3s ease;
    user-select: none;
    border-top-right-radius:${({ isVisible }) => isVisible ? '0px' : '8px'};
    border-bottom-right-radius: ${({ isVisible }) => isVisible ? '0px' : '8px'};
    animation: ${smoothGradientFlow} 10s ease infinite;
    display: flex;
    align-items: center;

    transition: all 0.3s ease;

    &:hover{
        opacity: 0.8;
    }
    &:active{
        opacity: 0.6;
    }

    & .add-text{
        padding: 4px 8px;
        border-radius: 6px;
        background: #FFFFFF33;
    }
`;

const PromoteCard = () => {
    return (
        <Wrapper isVisible={false}>
            <div className="add-text">
                Add
            </div>
        </Wrapper>
    )
}

export default PromoteCard
