import { createUseStyles } from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        background: '#F8F8F9',
    },
    headerWrapper: {
        display: 'flex',
        alignItems: 'center',
        padding: '7px 23px',

        '& > div': {
            color: 'var(--color-text-muted)',
            fontWeight: "var(--font-weight-regular)",
            fontSize: '12px',
            lineHeight: '14px',
        },
    },
    checkboxWrapper: {
        width: 40,
    },
    userWrapper: {
        width: 180,
    },
    amountWrapper: {
        width: 100,
    },
    currencyWrapper: {
        width: 80,
    },
    networkWrapper: {
        width: 80,
    },
    statusWrapper: {
        width: 100,
    },
    dateWrapper: {
        width: 180,
    },
    reasonWrapper: {
        width: 200,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    fomoIdWrapper: {
        width: 100,
    },
    transactionWrapper: {
        width: 200,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },

    actionsWrapper: {
        width: 160,
    },

});

export const Wrapper = 'div';