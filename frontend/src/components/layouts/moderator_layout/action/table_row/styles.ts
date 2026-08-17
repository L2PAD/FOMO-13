import {createUseStyles} from 'react-jss';

interface Props {
    status: string,
    rating: number,
}

export const useStyles = createUseStyles({
    wrapper: {
        background: ({status}: Props) => status ? 'rgba(255, 88, 88, 0.05)' : 'white',
    },
    rowWrapper: {
        display: 'flex',
        alignItems: 'center',
        padding: '16px 23px',
        borderBottom: '1px solid #eee',
    },
    projectWrapper: {
        width: 250,
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
        width: 130,
    },
    investorsWrapper: {
        width: 255,
    },
    raisedWrapper: {
        width: 92,
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
        width: 81,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    tagCircle: {
        width: 16,
        height: 16,
        background: 'rgba(115, 128, 148, 0.5)',
        borderRadius: '100%',
    },
    tagWrapper: {
        width: 164,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        fontSize: '12px',
        lineHeight: '14px',
        color: 'var(--color-text-muted)',
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
        marginLeft:'auto'
    },
    dotsAction: {
        '& svg circle': {
            fill: 'rgba(115, 128, 148, 0.5)',
        }
    },
})