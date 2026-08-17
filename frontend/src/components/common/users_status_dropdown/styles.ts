import {createUseStyles} from 'react-jss';
import {USERS_STATUS_LIST} from '../../../static_content/dropdowns_data';

interface Props {
    status: USERS_STATUS_LIST;
}

const getStatusColor = (status: USERS_STATUS_LIST) => {
    switch(status) {
        case USERS_STATUS_LIST.ACTIVE:
            return 'var(--color-primary)'
        case USERS_STATUS_LIST.BLOCKED:
            return 'var(--color-danger)'
        default:
            return 'var(--color-primary)'
    }
}

const getStatusColorBackground = (status: USERS_STATUS_LIST) => {
    switch(status) {
        case USERS_STATUS_LIST.ACTIVE:
            return 'rgba(0, 192, 153, 0.1)'
        case USERS_STATUS_LIST.BLOCKED:
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

        '& svg path': {
            fill: ({status}: Props) => getStatusColor(status),
        },
    },
    dropdown: {
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

        '& li': {
            listStyleType: 'none',
            fontWeight: "var(--font-weight-regular)",
            cursor: 'pointer',

            '&.active': {
                fontWeight: "var(--font-weight-semibold)",
            },
        }
    },
})