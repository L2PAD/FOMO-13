import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        background: 'var(--color-white)',
        border: '1px solid rgba(83, 98, 124, 0.07)',
        boxShadow: '4px 4px 0px #EEEEEE',
        borderRadius: 8,
        padding: 16,
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
    },
    exchangeWrapper: {
        width: 210,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',

        '& > img': {
            width: 24,
            borderRadius: 100,
        },
    },
    pairWrapper: {
        width: 180,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    priceWrapper: {
        width: 175,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    volumeWrapper: {
        width: 155,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    percentVolumeWrapper: {
        width: 130,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
    updatedWrapper: {
        width: 200,
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        lineHeight: '17px',
    },
})