import {FC, useState,useCallback} from 'react';
import FirstStep from './steps/first_step';
import SecondStep from './steps/second_step';
import ThirdStep from './steps/third_step';
import Modal from '../../../../common/modal';
import Loader from '../../../../common/loader';
import AddInvestorsModal from '../add_investors_modal';
import useFetch from '../../../../hooks/useFetch';
import getAccessToken from '../../../../utils/getAccessToken';
import reloadWindow from '../../../../utils/reloadWindow';
import getUserRole from '../../../../utils/getUserRole';
import { configureFetchForm } from '../../../../services/config';
import useCreateProject,{Investor} from '../../../../hooks/useCreateProject';
import {NextStepButton, PreviousStepButton, ProgressNumber, ProgressWrapper} from './styles';

interface Props {
    onClose: () => void;
    hideModal: () => void;
    backToCreatingModal: () => void;
    isAddInvestorsModal: boolean
}

const CreatingProjectModal: FC<Props> = ({onClose, hideModal,isAddInvestorsModal,backToCreatingModal}) => {
    const [progressValue, setProgressValue] = useState(1)
    const {data,inputsHandler} = useCreateProject()
    const {loading,dataHandler} = useFetch(
        `projects/${getUserRole()}`,
        configureFetchForm('POST',
        {...data},
        {'Authorization': `Bearer ${getAccessToken()}`}),
        true
    )

    const handleStep = () => {
        switch (progressValue) {
            case 1:
                return <FirstStep inputsHandler={inputsHandler} data={data}/>
            case 2:
                return <SecondStep hideModal={hideModal} inputsHandler={inputsHandler} data={data}/>
            case 3:
                return <ThirdStep inputsHandler={inputsHandler} data={data} />
        }
    }

    const confirmCreateProject = () => {
        dataHandler().then(() => {
            onClose()
            reloadWindow()
        })
    }

    const investorsHandler = useCallback((selectedInvestors:Array<Investor>) => {
        inputsHandler(selectedInvestors,'investors')
    },[data])
    
    if(loading) return <Loader/>

    return (
        isAddInvestorsModal
        ?
        <AddInvestorsModal
        data={data}
        onClose={backToCreatingModal}
        addInvestors={investorsHandler}
        />
        :
        <Modal
            title='Creating project'
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
                <NextStepButton 
                disabled={!data.projectType}
                onClick={confirmCreateProject} type='fill'>
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

export default CreatingProjectModal;