import { useState, FC, useContext } from 'react';
import { useSelector } from 'react-redux';
import AllSupportData from '../../modals/AllSupportData';
import Loader from '../../../../common/loader';
import TableRow from './table_row';
import {useStyles} from './styles';
import { SupportContext } from '../..';
import { IAttachmentReport } from '../../../../types/global_types';

interface IProps {
    loading:boolean
}

const ReportsTable : FC<IProps> = ({loading}) => {
    const [selectedMessage,setSelectedMessage] = useState()
    const [isOpenModal,setIsOpenModal] = useState<boolean>(false)
    const {reports} = useContext(SupportContext)
 
    const {
        wrapper,
        headerWrapper,
        projectsCell,
        dateWrapper,
        investorsCell,
        raisedCell,
        fundingCell,
        typeCell,
        flagsCell,
        actionsCell,
        creatingModalWrapper,
    } = useStyles(false)

    if(loading){
        return <Loader/>
    }   

    return (
        <>
            <div className={wrapper}>
                <div className={`${headerWrapper} container`}>
                    <div className={projectsCell}>
                        Reporter 
                    </div>
                    <div className={projectsCell}>
                        Reported
                    </div>
                    <div className={dateWrapper}>
                        Date
                    </div>
                    <div className={typeCell}>
                        Type
                    </div>
                    <div className={typeCell}>
                        Subtype
                    </div>
                    <div className={actionsCell}>
                        
                    </div>
                </div>
            </div>
            <div>
                {
                    reports?.length
                    ?
                    reports?.map((item:IAttachmentReport) => {
                        return (
                            <TableRow 
                            onClick={(item:any) => {
                                setSelectedMessage(item)
                                setIsOpenModal(true)
                            }}
                            key={item._id} 
                            item={item}
                            />
                        )
                    })
                    :
                    <></>
                }
            </div>
            {
                isOpenModal && selectedMessage
                ?
                <AllSupportData
                visible={isOpenModal}
                supportItem={selectedMessage}
                modalHandler={() => setIsOpenModal(false)}
                />
                :
                <></>
            }
        </>
    );
};

export default ReportsTable;