import {createUseStyles} from 'react-jss';

interface Props {
    isOpen: boolean;
}

export const useStyles = createUseStyles({
    wrapper: {
        position: 'relative',
    },
    dropdownTitle: {
        background: 'white',
        borderRadius: '8px 8px 0 0',
        border: ({isOpen}: Props) => !isOpen ? 'none' : '1px solid rgba(83, 98, 124, 0.07)',
        borderBottom:  'none !important',
        padding: ({isOpen}: Props) => isOpen ? '9px 11px 10px' : 12,
        color: 'var(--color-text-muted)',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '14px',
        lineHeight: '16px',
        display: 'flex',
        gap: 5,
        cursor: 'pointer',

        '& span': {
            display: 'flex',
            gap: 10,
            color: 'var(--color-text-primary)',
            fontWeight: "var(--font-weight-semibold)",
            fontSize: '14px',
            lineHeight: '16px',
            alignItems: 'center',

            '& svg': {
                transition: '.3s',
                transform: ({isOpen}: Props) => isOpen ? 'rotate(180deg)' : ''
            }
        }
    },
    dropdownWrapper: {
        position: 'absolute',
        background: 'white',
        borderRadius: '0 0 8px 8px',
        border: '1px solid rgba(83, 98, 124, 0.07)',
        borderTop:  'none !important',
        padding: '0 12px 14px',
        width: '100%',
        zIndex: 2,

        '& ul': {
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
        },

        '& ul li': {
            listStyleType: 'none',
            cursor: 'pointer',
        }
    }
})