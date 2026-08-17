import styled from 'styled-components';


export const Wrapper = styled.div`
    max-width: 95vw;
    margin: 40px auto;

    & hr{
        border: 0.5px solid var(--color-text-muted);
        background: none;
        margin: 20px 0px;
        opacity: 0.2;
    }
`

export const InfoRow = styled.div`
    margin-top: 25px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 24px;

    & p{
        color:var(--color-text-muted);
    }
`

export const InfoItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`

export const EventTimeWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    & i{
        font-size: 22px;
        font-weight: var(--font-weight-semibold);
    }

    & span{
        color: var(--color-text-muted);
    }
`

export const TaskHead = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap:8px;
    & svg{
        transform: rotate(180deg);
    }

    & button{
        padding:8px 12px;
        border:none;
        background: transparent;
        transition: all 0.3s ease;

        &:hover{
            background: #8080802f;
        }
    }
`

export const DescriptionWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap:8px;
`

export const TableWrapper = styled.div`

`

export const TableBody = styled.div`
    margin-top: 10px;
    border: 1px solid gray;
    border-radius: 12px;
`

export const TableHead = styled.div`
    display: grid;
    grid-template-columns: 0.3fr 0.5fr 0.4fr 1fr 1fr;
    gap: 25px;
    padding: 8px 14px;
`

export const TableList = styled.div`
    border-top: 1px solid gray;
    margin: 0;
`

export const TableItem = styled.div<{ approved: boolean}>`
    padding: 16px 14px;
    display: grid;
    grid-template-columns: 0.3fr 0.5fr 0.4fr 1fr 1fr;
    gap: 25px;
    background: ${props => props.approved ? '#06790629' : '#ffff000c'};

    &:hover{
        background: #8080801b;
    }

`

export const ActionBtns = styled.div`
    margin-left: auto;
    display: flex;
    gap: 12px;
`

export const TaskHeadColumn = styled.div`
    display: flex;
    align-items: center;
`