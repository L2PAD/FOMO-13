import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    descriptionWrapper: {
        fontWeight: "var(--font-weight-regular)",
        fontSize: '18px',
        lineHeight: '21px',
        marginBottom: 24,

        '& > span': {
            color: 'var(--color-text-muted)'
        },
    },
    searchWrapper: {
        position: 'relative',
        marginBottom: 16,

        '& > svg': {
            position: 'absolute',
            bottom: 5,
            left: 12,
        }
    },
    searchInput: {
        border: 'none',
        background: '#F8F8F9',
        borderRadius: 8,
        padding: '8px 12px 8px 35px',
        width: '100%',

        '&::placeholder': {
            marginTop: 10,
            color: 'rgba(115, 128, 148, 0.5)',
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '16px',
            lineHeight: '19px',
        }
    },
    actionsWrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 16,
    },
    pubsWrapper: {
        boxShadow: '4px 4px 0px #EEEEEE',
        border: '1px solid rgba(83, 98, 124, 0.07)',
        borderRadius: 8,
        padding: '0 16px',
    },
})