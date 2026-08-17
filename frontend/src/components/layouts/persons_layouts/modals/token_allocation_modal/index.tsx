import {useState,FC, useCallback} from 'react';
import {SubmitButton} from '../../../../common/global_modals/description_modal/styles';
import { useDispatch,useSelector } from 'react-redux';
import { IProject } from '../../../../hooks/useCreateProject';
import { updateProjectByKeys,editProject } from '../../../../../store/slices/editProjectSlice';
import updateProject from '../../../../services/projects/updateProject';
import Modal from '../../../../common/modal';
import InputWithLabel from '../../../../common/components_for_modals/number-input_with_label';
import {AddButton, FlagRow, HeaderRow, ModalRow, Total} from './styles';
import usePath from '../../../../hooks/usePath';

interface Props {
    onClose: () => void;
}

const TokenAllocationModal: FC<Props> = ({onClose}) => {
    const dispatch = useDispatch()
    const project : IProject = useSelector((state:any) => state.editProject.project)
    const location : string = usePath() || 'projects'

    const [data,setData] = useState({
        totalSupply: project.totalSupply || 0,
        totalForSale:project.totalForSale || 0,
        allocation:project.totalAllocation || []
    })

    const calculateTotalAllocation = (allocation:Array<{name:string,value:number}>) : string => {
        const result : number = allocation.reduce((acc,current) => acc + current.value,0)
        console.log(result)
        return String(result)
    }

    const addAllocation = () => {
        setData({...data,allocation:[...data.allocation,{name:'',value:0}]})
    }

    const inputsHandler = (value:number,name:string) : void => {
        setData({...data,[name]:value})
    }

    const confirmChanges = async () : Promise<void> => {
        const editedProject : IProject = {
            ...project,
            totalSupply:data.totalSupply,
            totalForSale:data.totalForSale,
            totalAllocation:data.allocation
        }

        await updateProject(`${location}/${project._id}`,editedProject)

        dispatch(updateProjectByKeys({
            totalSupply:data.totalSupply,
            totalForSale:data.totalForSale,
            totalAllocation:data.allocation
        }))

        onClose()
    }

    const allocationHandler = useCallback((value:string,name:string,index:number) => {
        setData((prev) => {
            return {...prev,allocation:prev.allocation.map((item,i) => {
                if(i === index) {
                    return {...item,[name]:name === 'name' ? value : Number(value)}
                }
                return item
            })}
        })
    },[data])


    return (
        <Modal title='Token Allocation' onClose={onClose} variant='small'>
            <ModalRow>
                <InputWithLabel
                    type='number'
                    name='totalSupply'
                    label='Total Tokens Supply'
                    value={data.totalSupply}
                    onChange={inputsHandler}
                />
            </ModalRow>
            <ModalRow>
                <InputWithLabel
                    type='number'
                    name='totalForSale'
                    label='Token For Sale'
                    value={data.totalForSale}
                    onChange={inputsHandler}
                />
            </ModalRow>
            <ModalRow>
                <HeaderRow >
                    <p>Allocation</p>
                    <AddButton onClick={addAllocation}>
                        + Add
                    </AddButton>
                </HeaderRow>
                {
                    data?.allocation.length
                    ?
                    data?.allocation.map((allocation,index) => {
                        return ( 
                            <FlagRow key={index}>
                                <span>#{(index + 1)}</span>
                                <input
                                    onChange={(e) => allocationHandler(e.target.value,'name',index)}
                                    value={allocation.name}
                                    placeholder='Name'
                                    type="text"
                                />
                                <input
                                    onChange={(e) => allocationHandler(e.target.value,'value',index)}
                                    value={allocation.value}
                                    placeholder='Value'
                                    type="text"
                                />
                            </FlagRow>
                        )
                    })
                    :
                    <></>
                }
 
                <Total>Total: {
                    data.allocation.length
                    ?
                    calculateTotalAllocation(data.allocation)
                    :
                    '0'
                    }%</Total>
            </ModalRow>
            <SubmitButton onClick={confirmChanges} type='fill'>
                Save changes
            </SubmitButton>
        </Modal>
    );
};

export default TokenAllocationModal;