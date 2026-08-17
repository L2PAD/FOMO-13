import { FC, useState, useCallback } from 'react';
import TableRow from './table_row';
import {useStyles} from './styles';
import { useDispatch } from 'react-redux';

interface IProps {
    data: Array<any>
}

const ActionsTable : FC<IProps> = ({data}) => {
    const dispatch = useDispatch()
    const [hideStepsModal, setHideStepsModal] = useState(false)
    const [isAddInvestorsModal, setIsAddInvestorsModal] = useState(false)
    const [isUpdatingModal, setIsUpdatingModal] = useState(false)
    const {
        wrapper,
        headerWrapper,
        projectsCell,
        statusCell,
        investorsCell,
        raisedCell,
        fundingCell,
        typeCell,
        flagsCell,
        creatingModalWrapper,
    } = useStyles(isUpdatingModal)

    return (
        <>
            <div className={wrapper}>
                <div className={`${headerWrapper} container`}>
                    <div className={projectsCell}>
                        Action
                    </div>
                    <div className={statusCell}>
                        Date
                    </div>
                    <div className={fundingCell}>
                        Moderator
                    </div>
                </div>
            </div>
            <div>
                {
                    data
                    ?
                    data.map((action:any) => {
                        return (
                            <TableRow 
                            key={action._id} 
                            action={action} 
                            />
                        )
                    })
                    :
                    <></>
                }
            </div>
        </>
    );
};

export default ActionsTable;