import { FC, useCallback } from 'react';
import CloseIcon from '../../Icons/close_icon';
import {DeleteButton, UserData, UserRow, Wrapper} from './styles';
import avatarImage from '../../../../assets/img/avatar.png'
import loader from '../../../services/loader';
import { Investor, IProject } from '../../../hooks/useCreateProject';

interface Props {
    investors?:Array<Investor>,
    data?:IProject,
    inputsHandler?: (value:any,inputName:string) => void
    inputName?:string
}

const UsersWindow: FC<Props> = ({investors,data,inputsHandler,inputName}) => {
    const deleteInvestorFromList = useCallback((id:string) => {
        if(!data || !inputsHandler) return
  
        // @ts-ignore
        const currentItems: Array<any> | undefined = data[inputName || 'investors']

        inputsHandler(currentItems?.filter((investor) => {
            return investor._id !== id
        }),inputName || 'investors')
    },[data,investors])

    return (
        <Wrapper>
            {
                investors && investors.map((investor : Investor) => {
                    return (
                        <UserRow key={investor._id}>
                            <UserData>
                                <img src={investor?.logo ? loader(investor?.logo) : avatarImage} alt={investor.name}/>
                                {investor.name}
                            </UserData>
                            <DeleteButton onClick={() => deleteInvestorFromList(investor._id)}>
                                <CloseIcon />
                            </DeleteButton>
                        </UserRow>
                    )
                })
            
            }
        </Wrapper>
    );
};

export default UsersWindow;