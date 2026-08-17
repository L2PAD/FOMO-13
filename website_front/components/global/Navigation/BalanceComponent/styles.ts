import styled from "styled-components";
import BaseCard from "../../common/BaseCard";

export const Wrapper = styled(BaseCard)`
    padding:20px;
      border: 1px solid var(--main-stroke);

    & .title{
        height: 24px;
        font-size: 16px;
        color: var(--main-black);
        line-height: 16px;
        margin-bottom: 14px;
        font-weight: var(--font-weight-semibold);
        display: flex;
        align-items: center;
        justify-content: space-between;
        button{
            display: flex;

            &:hover{
                opacity: 0.6;
            }
        }
        
    }
`

export const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;

    span{
        color: var(--main-gray);
        font-size: 14px;
    }

    div{
        display: flex;
        font-weight: var(--font-weight-semibold);
        font-size: 14px;
        color: var(--main-black);
    }
`

export const Actions = styled.div`
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 12px;

    button{
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        transition: all 0.3s ease;
        color: white;
        border-radius: 8px;
        width: 50%;

        &:disabled{
            background: #F9F9F9 !important;
            border: 1px solid #F0F2F5 !important;
            color: var(--color-text-soft) !important;  
            cursor: not-allowed;
            path{
                stroke: var(--color-text-soft) !important; 
            }
        }
        

    }

    & .deposit-button{
        font-weight: var(--font-weight-semibold);
        font-size: 12px;
        line-height: 100%;
        padding: 8px 18px;
        background: var(--main-green);

        &:hover{
            background: var(--main-green-hover);
        }

        &:active{
            opacity: 0.8;
        }
    }

    & .withdraw-button{
   font-weight: var(--font-weight-semibold);
        font-size: 12px;
        line-height: 100%;
        padding: 8px 18px;
        background: var(--main-blue);

        &:hover{
            background: var(--main-blue-hover);
        }

        &:active{
            opacity: 0.8;
        }
    }
`