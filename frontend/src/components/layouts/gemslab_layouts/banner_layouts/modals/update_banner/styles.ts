import styled from 'styled-components';

export const Wrapper = styled.div`
    padding: 10px 0px;
`

export const InputsWrapper = styled.div`
    width:100%;
    margin:12px 0px ;
    display: flex;
    flex-direction: column;
    gap:10px;
`
export const Head = styled.div`
    margin:12px 0px ;

`

export const Key = styled.span`
    font-size: 16px;
`

export const Value = styled.span`
    font-weight: var(--font-weight-semibold);
`

export const DateInputWrapper = styled.div`
    display: flex;
    flex-direction: column;
    & label {
        font-weight: var(--font-weight-semibold);
        font-size: 14px;
        line-height: 17px;
        color: rgb(115, 128, 148);
        margin-bottom: 7px;
    }
`