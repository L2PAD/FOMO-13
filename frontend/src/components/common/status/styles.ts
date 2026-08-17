import {createUseStyles} from 'react-jss';
import {STATUS_LIST} from '../../../static_content/dropdowns_data';

interface Props {
    status: STATUS_LIST;
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
        color: ({status}: Props) => getStatusColor(status),
        padding: '4px 6px',
        background: ({status}: Props) => getStatusColorBackground(status),
        borderRadius: 8,
        width: 'max-content',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',

        '& svg path': {
            fill: ({status}: Props) => getStatusColor(status),
        },
    },
})