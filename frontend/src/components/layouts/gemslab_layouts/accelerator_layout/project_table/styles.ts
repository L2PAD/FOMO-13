import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        background: '#F8F8F9',
    },
    headerWrapper: {
        display: 'flex',
        alignItems: 'center',
        padding: '8px 23px',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '12px',
        lineHeight: '14px',
        color: 'var(--color-text-muted)',
    },
    projectsCell: {
        width: 249,
    },
    statusCell: {
        width: 120,
    },
    investorsCell: {
        width: 225,
    },
    raisedCell: {
        width: 92,
    },
    fundingCell: {
        width: 110,
    },
    typeCell: {
        width: 70,
    },
    priceCell: {
        width: 178,
    },
    flagsCell: {
        width: 246,
    },
})