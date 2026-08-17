import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    headerWrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 23px',
    },
    headerLeftWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
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
})