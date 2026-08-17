import {FC,useState,useEffect, useCallback} from 'react';
import Modal from '../../../../common/modal';
import SearchIcon from '../../../../common/Icons/search_icon';
import {SearchInput, SearchWrapper, UserData, UserRow, UsersWrapper} from './styles';
import CheckIcon from '../../../../common/Icons/check_icon';
import UnchekIcon from '../../../../common/Icons/uncheck_icon';
import {NextStepButton} from '../../../projects_layouts/modals/creating_project/styles';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';
import { IProject , Investor} from '../../../../hooks/useCreateProject';
import avatarImage from '../../../../../assets/img/avatar.png'

const investorsData = [
    {
        _id:'11',
        img: avatarImage,
        name:'Dr. Laurent El Ghaul',
        selected:false
    },
    {
        _id:'12',
        img: avatarImage,
        name:'Dr. Laurent El Ghaul',
        selected:false
    },
    {
        _id:'13',
        img: avatarImage,
        name:'Dr. Laurent El Ghaul',
        selected:false
    },
    {
        _id:'14',
        img: avatarImage,
        name:'Dr. Laurent El Ghaul',
        selected:false
    },
    {
        _id:'15',
        img: avatarImage,
        name:'Dr. Laurent El Ghaul',
        selected:false
    },
]

interface Props {
    onClose: () => void;
    addInvestors: (investoes:Array<any>) => void;
    data:IProject,
}

const AddInvestorsModal: FC<Props> = ({onClose, addInvestors, data}) => {
    const [selectedInvestors,setSelectedInvestors] = useState<Array<Investor>>([])
    
    const toggleInvestor = useCallback((investor:Investor) => {
        if(selectedInvestors.find((inv) => inv._id === investor._id)){
            return setSelectedInvestors((prev) => prev.filter((inv) => inv._id !== investor._id))
        }
        setSelectedInvestors((prev) => {
            return [...prev,{...investor,selected:!investor.selected}]
        })
    },[selectedInvestors])

    const confirmInvestors = () => {
        addInvestors(selectedInvestors)
        onClose()
    }

    return (
        <Modal title='Add investors' onClose={onClose} variant='small'>
            <SearchWrapper>
                <SearchIcon />
                <SearchInput
                    type="text"
                    placeholder='Search'
                />
            </SearchWrapper>
            <UsersWrapper>
                {
                    investorsData
                    ?
                    investorsData.map((investor) => {
                        return (
                            <UserRow onClick={() => toggleInvestor(investor)} key={investor._id}>
                                  {
                                        selectedInvestors.find((inv) => inv._id === investor._id)
                                        ?
                                        <CheckIcon />
                                        :
                                        <UnchekIcon/>
                                    }
                                <UserData>
                                    <img src={investor.img} alt={investor.name}/>
                                    {investor.name}
                                </UserData>
                            </UserRow>
                        )
                    })
                    :
                    <></>
                }
            </UsersWrapper>
            <SubmitButton onClick={confirmInvestors} type='fill'>
                Add {selectedInvestors.length} funds
            </SubmitButton>
        </Modal>
    );
};

export default AddInvestorsModal;