import styled from "styled-components";

export const TabsWrapper = styled.div`
    width: 100%;
    margin: 20px 0;

    & #tabs-wrapper {
        width: 100%;

        & .tab-item{
            width: 50%;

            display: flex;
            align-items: center;
            justify-content: center;
        }
    }
`