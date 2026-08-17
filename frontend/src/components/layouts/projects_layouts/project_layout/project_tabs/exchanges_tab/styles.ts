import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    editMainWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        color: 'var(--color-info)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        cursor: 'pointer',

        '& svg': {
            width: 16,

            '& path': {
                fill: 'var(--color-info)'
            }
        }
    },
    headerWrapper: {
        display: 'flex',
        padding: '8px 16px',

        '& > div': {
            fontWeight: "var(--font-weight-regular)",
            fontSize: '12px',
            lineHeight: '14px',
            color: 'var(--color-text-muted)',
        },
    },
    exchangeWrapper: {
        width: 210,
    },
    pairWrapper: {
        width: 180
    },
    priceWrapper: {
        width: 175,
    },
    volumeWrapper: {
        width: 155,
    },
    percentVolumeWrapper: {
        width: 130,
    },
    updatedWrapper: {
        width: 200,
    },
})