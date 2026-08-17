import {createUseStyles} from 'react-jss';

export const useStyles = createUseStyles({
    wrapper: {
        background: 'white',
        border: '1px solid rgba(83, 98, 124, 0.07)',
        boxShadow: '2px 2px 0px #EEEEEE',
        borderRadius: 8,
        width: 32,
        height: 32,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transition:'all 0.3s ease',

        '&:hover':{
            opacity:0.8
        }
    },

})