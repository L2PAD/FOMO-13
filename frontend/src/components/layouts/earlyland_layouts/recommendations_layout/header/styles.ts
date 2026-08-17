import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 23px 10px'
    },
    leftWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
    },
    mainTitle: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '40px',
        lineHeight: '48px',
    },
    searchWrapper: {
        position: 'relative',

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
        width: 345,

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
        gap: 8,
        alignItems: 'center',
    },
})