import styled from "styled-components";

export const CollectionWrapper = styled.div`
    position: relative;
    padding: 12px;
    border: 1px solid black;
    border-radius: 6px;
`

export const ProjectWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;

    img {
        max-width: 64px;
        height: auto;
        object-fit: cover;
        border-radius: 12px;
    }
`

export const ProjectInfoWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    & div {
        font-size: 20px;
        font-weight: var(--font-weight-semibold);
    }   
    & span {
        font-weight: var(--font-weight-regular);
    }   
`

export const InfoRow = styled.div`
    display: flex;
    gap: 36px;
`

export const InfoItem = styled.div`
`

export const InfoLabel = styled.div`
    font-size: 16px;
    color: #656363;
    margin-bottom: 8px;
`

export const InfoValue = styled.div`
    font-size: 16px;
    font-weight: var(--font-weight-semibold);

`

export const InfoButtons = styled.div`
    position: absolute;
    top: 12px;
    right: 12px;

    display: flex;
    gap: 12px;
`

export const NftsRow = styled.div`
    margin-top: 16px;
`

export const NftsTitle = styled.div`
    font-size: 16px;
    color: #656363;
    margin-bottom: 8px;
`