import {createUseStyles} from 'react-jss';

interface Props {
    status: string,
    rating: number,
}

export const useStyles = createUseStyles({
    wrapper: {
        background: ({status}: Props) => status === 'error' ? 'rgba(255, 88, 88, 0.05)' : 'white',
        borderBottom: '1px solid #eee',
        borderTop: '1px solid #eee',
    },
    rowWrapper: {
        display: 'flex',
        alignItems: 'center',
        padding: '16px 23px',
    },
    projectWrapper: {
        width: 249,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    projectImage: {
        width: 32,
    },
    projectDataWrapper: {
        display: 'flex',
    },
    projectTitle: {
        display: 'flex',
        alignItems: 'center',
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
        gap: 6,

        '& span': {
            color: 'var(--color-primary)',
        }
    },
    projectDescription: {
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '17px',
        color: 'var(--color-text-muted)',
    },
    statusWrapper: {
        width: 120,
    },
    investorsWrapper: {
        width: 225,
    },
    raisedWrapper: {
        width: 95,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    fundingWrapper: {
        width: 110,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    typeWrapper: {
        width: 70,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    tagWrapper: {
        width: 178,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    flagsWrapper: {
        width: 68,
    },
    ratingWrapper: {
        width: 118,
    },
    actionsWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
    },
    dotsAction: {
        '& svg circle': {
            fill: 'rgba(115, 128, 148, 0.5)',
        }
    },
})