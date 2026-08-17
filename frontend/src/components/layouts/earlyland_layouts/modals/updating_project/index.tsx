import {FC, useState, useCallback} from 'react';
import Modal from '../../../../common/modal';
import {NextStepButton, PreviousStepButton, ProgressNumber, ProgressWrapper} from './styles';
import FirstStep from './steps/first_step';
import SecondStep from './steps/second_step';
import ThirdStep from './steps/third_step';
import useFetch from '../../../../hooks/useFetch';
import { configureFetchForm } from '../../../../services/config';
import getAccessToken from '../../../../utils/getAccessToken';
import reloadWindow from '../../../../utils/reloadWindow';
import useUpdateProject from '../../../../hooks/useUpdateProject';
import { Investor } from '../../../../hooks/useCreateProject';
import AddInvestorsModal from '../add_investors_modal';
import Loader from '../../../../common/loader';

interface Props {
    onClose: () => void;
    hideModal: () => void;
    backToUpdatingModal: () => void
    isAddInvestorsModal:boolean
}

const UpdatingProjectModal: FC<Props> = ({onClose, hideModal,isAddInvestorsModal,backToUpdatingModal}) => {
    const [progressValue, setProgressValue] = useState(1)
    const {data,inputsHandler} = useUpdateProject()
    const {loading,dataHandler} = useFetch(
        `projects/${data._id}`,
        configureFetchForm('PUT',data,{'Authorization': `Bearer ${getAccessToken()}`}),
        true
    )
    
    const investorsHandler = useCallback((selectedInvestors:Array<Investor>) => {
        inputsHandler(selectedInvestors,'investors')
    },[data])

    const confirmCreateProject = () => {
        dataHandler().then(() => {
            onClose()
            reloadWindow()
        })
    }

    const handleStep = () => {
        switch (progressValue) {
            case 1:
                return <FirstStep data={data} inputsHandler={inputsHandler}/>
            case 2: 
                return <SecondStep data={data} inputsHandler={inputsHandler} hideModal={hideModal} />
            case 3:
                return <ThirdStep data={data} inputsHandler={inputsHandler}/>
        }
    }

    if(loading){
        return <Loader/>
    }
    
    return (
        isAddInvestorsModal
        ?
        <AddInvestorsModal
            data={data}
            onClose={backToUpdatingModal}
            addInvestors={investorsHandler}
        />
        :
        <Modal
            title='Updating project'
            onClose={onClose}
            variant='small'
            className='creating_project_modal'
        >
            <ProgressWrapper>
                <ProgressNumber defaultValue={1} value={progressValue}>1</ProgressNumber>
                <ProgressNumber defaultValue={2} value={progressValue}>2</ProgressNumber>
                <ProgressNumber defaultValue={3} value={progressValue}>3</ProgressNumber>
            </ProgressWrapper>
            {handleStep()}
            {progressValue === 3 ? (
                <NextStepButton onClick={confirmCreateProject} type='fill'>
                    Finish
                </NextStepButton>
            ) : (
                <NextStepButton onClick={() => setProgressValue(state => state + 1)} type='fill'>
                    Next step
                </NextStepButton>
            )}
            {progressValue > 1 && <PreviousStepButton onClick={() => setProgressValue(state => state - 1)} >
                Previous step
            </PreviousStepButton>}
        </Modal>
    );
};

export default UpdatingProjectModal;