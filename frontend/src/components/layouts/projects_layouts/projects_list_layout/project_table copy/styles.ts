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
        width: 110,
    },
    validationCell:{
        width: 130,
    },
    investorsCell: {
        width: 245,
    },
    raisedCell: {
        width: 92,
    },
    fundingCell: {
        width: 110,
    },
    typeCell: {
        width: 240,
    },
    flagsCell: {
        width: 246,
    },
    creatingModalWrapper: {
        '& div': {
            opacity: (props: boolean) => props ? '1' : '0',
            visibility: (props: boolean) => props ? 'visible' : 'hidden',
        },

        '& .creating_project_modal': {
            zIndex: 99999,
            position: 'absolute',
            top: '20%',
            left: '40.6%',
            opacity: (props: boolean) => props ? '1' : '0',
            visibility: (props: boolean) => props ? 'visible' : 'hidden',
            transition:'all 0.4s ease'
        }
    },
})