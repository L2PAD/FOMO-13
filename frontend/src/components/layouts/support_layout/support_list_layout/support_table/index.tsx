import { useState, FC } from 'react';
import { useSelector } from 'react-redux';
import AllSupportData from '../../modals/AllSupportData';
import Loader from '../../../../common/loader';
import TableRow from './table_row';
import {useStyles} from './styles';

interface IProps {
    loading:boolean
}

const SupportTable : FC<IProps> = ({loading}) => {
    const [selectedMessage,setSelectedMessage] = useState()
    const [isOpenModal,setIsOpenModal] = useState<boolean>(false)
    const data = useSelector((state:any) => state.searchMessages)
 
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
    } = useStyles(false)

    if(loading){
        return <Loader/>
    }   

    return (
        <>
            <div className={wrapper}>
                <div className={`${headerWrapper} container`}>
                    <div className={projectsCell}>
                        Theme
                    </div>
                    <div className={projectsCell}>
                        Message
                    </div>
                    <div className={projectsCell}>
                        Date
                    </div>
                    <div className={projectsCell}>
                        Category
                    </div>
                    <div className={projectsCell}>
                        User
                    </div>
                    <div className={projectsCell}>
                        File
                    </div>
                </div>
            </div>
            <div>
                {
                    data.items?.length
                    ?
                    data.items?.map((item:any) => {
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

export default SupportTable;