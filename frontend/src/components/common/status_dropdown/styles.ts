import {createUseStyles} from 'react-jss';
import {STATUS_LIST} from '../../../static_content/dropdowns_data';

interface Props {
    status: STATUS_LIST;
    isOpen: boolean | undefined;
}

const getStatusColor = (status: STATUS_LIST) => {
    switch(status) {
        case STATUS_LIST.ACTIVE:
            return 'var(--color-primary)'
        case STATUS_LIST.UPCOMING:
            return '#E9B500'
        case STATUS_LIST.ENDED:
            return 'var(--color-danger)'
        case STATUS_LIST.NEW:
            return 'var(--color-primary)'
        case STATUS_LIST.BLOCKED:
            return 'var(--color-danger)'
        default:
            return 'var(--color-primary)'
    }
}

const getStatusColorBackground = (status: STATUS_LIST) => {
    switch(status) {
        case STATUS_LIST.ACTIVE:
            return 'rgba(0, 192, 153, 0.1)'
        case STATUS_LIST.UPCOMING:
            return 'rgba(233, 181, 0, 0.1)'
        case STATUS_LIST.ENDED:
            return 'rgba(255, 88, 88, 0.1)'
        case STATUS_LIST.NEW:
            return 'rgba(0, 192, 153, 0.1)'
        case STATUS_LIST.BLOCKED:
            return 'rgba(255, 88, 88, 0.1)'
        default:
            return 'rgba(0, 192, 153, 0.1)'
    }
}

export const useStyles = createUseStyles({
    wrapper: {
        position: 'relative',
    },
    valueWrapper: {
        color: ({status}: Props) => getStatusColor(status),
        padding: '4px 14px 4px 6px',
        background: ({status}: Props) => getStatusColorBackground(status),
        borderRadius: 8,
        width: 'max-content',
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        cursor: 'pointer',
        border:'none',

        '& svg path': {
            fill: ({status}: Props) => getStatusColor(status),
        },
    },
    dropdown: {
        opacity: ({isOpen}: Props) => isOpen ? '1' : '0', 
        visibility: ({isOpen}: Props) => isOpen ? 'visible' : 'hidden', 
        transition: 'all 0.3s',
        paddingTop: 4,
        position: 'absolute',
        zIndex: 2,
        top: '100%',
    },
    dropdownWrapper: {
        background: 'white',
        border: '1px solid rgba(83, 98, 124, 0.07)',
        boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.15)',
        borderRadius: 8,
        width: 'max-content',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 11,
        fontSize: '12px',
        lineHeight: '14px',

        '& button': {
            listStyleType: 'none',
            fontWeight: "var(--font-weight-regular)",
            cursor: 'pointer',
            background:'transparent',
            border:'none',

            '&.active': {
                fontWeight: "var(--font-weight-semibold)",
            },
        }
    },
})