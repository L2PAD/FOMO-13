import { useState, FC, useContext } from 'react';
import { useSelector } from 'react-redux';
import AllSupportData from '../../modals/AllSupportData';
import Loader from '../../../../common/loader';
import TableRow from './table_row';
import {useStyles} from './styles';
import { SupportContext } from '../..';
import removeComment from '../../../../services/comments/removeComment';
import reloadWindow from '../../../../utils/reloadWindow';

interface IProps {
    loading:boolean
}

const CommentsTable : FC<IProps> = ({loading}) => {
    const {comments} = useContext(SupportContext)
    const [selectedMessage,setSelectedMessage] = useState()
    const [isOpenModal,setIsOpenModal] = useState<boolean>(false)
    const data = useSelector((state:any) => state.searchMessages)
 
    const confirmDeleteComment = async (id:string) => {
        await removeComment(`comments/admin/delete`,id)
        reloadWindow()
    }

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
                        Author
                    </div>
                    <div className={projectsCell}>
                        Date
                    </div>
                    <div className={projectsCell}>
                        Reports
                    </div>
                </div>
            </div>
            <div>
                {
                    comments?.length
                    ?
                    comments?.map((item:any) => {
                        return (
                            <TableRow 
                            onClick={(item:any) => {
                                confirmDeleteComment(item._id)
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

export default CommentsTable;