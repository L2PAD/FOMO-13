import {FC,useState,useEffect, useCallback} from 'react';
import Modal from '../../../../common/modal';
import SearchIcon from '../../../../common/Icons/search_icon';
import {SearchInput, SearchWrapper, UserData, UserRow, UsersWrapper} from './styles';
import CheckIcon from '../../../../common/Icons/check_icon';
import UnchekIcon from '../../../../common/Icons/uncheck_icon';
import {NextStepButton} from '../creating_project/styles';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';
import { IProject , Investor} from '../../../../hooks/useCreateProject';
import avatarImage from '../../../../../assets/img/avatar.png'
import useFetch from '../../../../hooks/useFetch';
import loader from '../../../../services/loader';
import Loader from '../../../../common/loader';

interface Props {
    onClose: () => void;
    addInvestors: (investors:Array<any>) => void;
    data:IProject,
}

const AddInvestorsModal: FC<Props> = ({onClose, addInvestors, data}) => {
    const [investors,setInvestors] = useState<Array<any>>([])
    const [selectedInvestors,setSelectedInvestors] = useState<Array<Investor>>([])

    const result = useFetch('funds')
    
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

    useEffect(() => {
        if(!result.data?.data?.items) return
        
        setInvestors(result.data?.data?.items)
    },[result.data])
    
    if(result.loading) return <Loader/>

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
                    investors
                    ?
                    investors.map((investor) => {
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
                                    <img src={loader(investor.logo) || avatarImage} alt={investor.name}/>
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
                Add {selectedInvestors.length} investors
            </SubmitButton>
        </Modal>
    );
};

export default AddInvestorsModal;