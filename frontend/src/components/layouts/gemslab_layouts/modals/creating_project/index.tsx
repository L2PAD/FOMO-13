import {FC, useState,useCallback, useEffect} from 'react';
import { createPool,getPoolId } from '../../../../smart/initialSmartMain';
import Modal from '../../../../common/modal';
import {NextStepButton, PreviousStepButton, ProgressNumber, ProgressWrapper} from './styles';
import { ICreateNews } from '../../../../hooks/useCreateNews';
import CreateFAQModal from '../../../settings_layout/FAQ_layout/modals/create/CreateFAQModal';
import FirstStep from './steps/first_step';
import SecondStep from './steps/second_step';
import ThirdStep from './steps/third_step';
import FourthStep from './steps/fourth_step';
import FifthStep from './steps/fifth_step';
import SixStep from './steps/six_step';
import LastStep from './steps/last_step';
import useCreateProject,{Investor} from '../../../../hooks/useCreateProject';
import AddInvestorsModal from '../add_investors_modal';
import useFetch from '../../../../hooks/useFetch';
import { configureProjectForm } from '../../../../services/config';
import getAccessToken from '../../../../utils/getAccessToken';
import Loader from '../../../../common/loader';
import reloadWindow from '../../../../utils/reloadWindow';
import getUserRole from '../../../../utils/getUserRole';
import TextModal from '../../../../common/text_modal/TextModal';
import RecommendationsModal from '../../../news_layout/modals/recommendations_modal/RecommendationsModal';
import { FAQItem } from '../../../settings_layout/FAQ_layout';
import SevenStep from './steps/seven_step';
import addDateAndTime from '../../../../utils/addDateAndTime';
import createGemslabProject from '../../../../services/projects/createGemslabProject';

interface Props {
    onClose: () => void;
    hideModal: () => void;
    backToCreatingModal: () => void;
    isAddInvestorsModal: boolean
}

type TextKeys = 'descriptionText' 
| 'overviewText' 
| 'tokenUtilityText'
| 'revenueText'
| 'stakingText'
| 'purchaseText'
| 'distributionText'


const CreatingProjectModal: FC<Props> = ({onClose, hideModal,isAddInvestorsModal,backToCreatingModal}) => {
    const [isProjectCreating,setIsProjectCreating] = useState<boolean>(false)
    const {data,inputsHandler} = useCreateProject('gemslab')
    const [partnersInputName,setPartnersInputName] = useState<'investors' | 'partners' | 'team'>('investors')
    const [progressValue, setProgressValue] = useState(1)
    const [isTextModal,setIsTextModal] = useState<boolean>(false)
    const [textEditKey,setTextEditKey] = useState<TextKeys>('descriptionText')
    const [isNewsModal,setIsNewsModal] = useState<boolean>(false)
    const [isFaqModal,setIsFaqModal] = useState<boolean>(false) 
    const [newsItem,setNewsItem] = useState<ICreateNews>({title:'',date:new Date,text:'',type:'',recommendations:[]})

    const {loading,dataHandler} = useFetch(
        `projects/${getUserRole()}`,
        configureProjectForm('POST',
        {...data,projectType:'gemslab'},
        {'Authorization': `Bearer ${getAccessToken()}`}),
        true
    )
    
    const confirmCreateProject = async () : Promise<void> => {
        setIsProjectCreating(true)

        const startTime = addDateAndTime(new Date(data.stakingDateStart || ''),data.stakingTimeStart || '') / 1000
        const greenTime = addDateAndTime(new Date(data.greenDate || ''),data.greenTimeStart || '') / 1000
        const yellowTime = addDateAndTime(new Date(data.yellowDate || ''),data.yellowTimeStart || '') / 1000
        const greenZone = Number(data.greenZone)
        const yellowZone = Number(data.yellowZone)
        const nftStakeNeed = Number(data.nftStakeNeed)
        const maxInvest = Number(data.totalMaxInvest)
        const minInvestUser = Number(data.minInvest)
        const maxInvestUser = Number(data.maxInvest)
        const comission = Number(data.comission) * 10
        const mediaComission = Number(data.mediaComission) * 10 - 15
        const media : Array<string> = data.media || []
        const isETH = Boolean(data.isETH)
   
        const poolId : number = await getPoolId()
        const {createSuccess,err} : any = await createPool(
            poolId,
            startTime, 
            greenTime,
            yellowTime,
            greenZone,
            yellowZone,
            nftStakeNeed,
            maxInvest,
            minInvestUser,
            maxInvestUser,
            comission,
            mediaComission,
            media,
            isETH
        )

        if(!createSuccess){
            alert(String(err))
            return
        }

        const {success} = await createGemslabProject({...data,poolId})

        if(success){
            onClose()
            reloadWindow()
        }
        setIsProjectCreating(false)
    }

    const investorsHandler = useCallback((selectedInvestors:Array<Investor>,inputName?:string) => {
        inputsHandler(selectedInvestors,inputName || partnersInputName)
    },[data,partnersInputName])

    const handleStep = () => {
        switch (progressValue) {
            case 1:
                return <FirstStep inputsHandler={inputsHandler} data={data}/>
            case 2:
                return <SecondStep hideModal={(name:any) => {
                    setPartnersInputName(name)
                    hideModal()
                }} 
                inputsHandler={investorsHandler} 
                data={data}/>
            case 3:
                return <ThirdStep inputsHandler={inputsHandler} data={data}/>
            case 4:
                return <FourthStep inputsHandler={inputsHandler} data={data}/>
            case 5: 
                return <FifthStep modalHandler={(key:TextKeys) => {
                    setIsTextModal(true)
                    setTextEditKey(key)
                    
                }} inputsHandler={inputsHandler} data={data}/>
            case 6:
                return <SixStep newsModalHandler={() => setIsNewsModal(true)} inputsHandler={inputsHandler} data={data}/>
            case 7:
                return <SevenStep
                modalHandler={() => setIsFaqModal(true)}
                inputsHandler={inputsHandler} data={data} />
            case 8:
                return <LastStep inputsHandler={inputsHandler} data={data} />
        }
    }

    const handleModal = () => {
        if(isAddInvestorsModal){
            return (
                <AddInvestorsModal
                type={partnersInputName}
                title={partnersInputName}
                data={data}
                onClose={backToCreatingModal}
                addInvestors={investorsHandler}
                />
            )
        }
        if(isTextModal){
            return (
                <TextModal
                onClick={() => setIsTextModal(false)}
                onClose={() => setIsTextModal(false)}
                title={'Text edit'}
                // @ts-ignore
                value={data[textEditKey] || ''}
                onChange={(value:any,name:any) => inputsHandler(value,textEditKey)}
                />
            )
        }
        if(isNewsModal){
            return (
                <RecommendationsModal
                onClose={() => setIsNewsModal(false)}
                changeHandler={(value:any,name:string | undefined) => {
                    if(!name) return 
                    setNewsItem((prev) => {
                        return {...prev,[name]:value}
                    })
                    inputsHandler(value,name)
                }}
                news={newsItem}
                path={'crypto'}
                />
            )
        }
        if(isFaqModal){
            return (
                <CreateFAQModal
                isVisible={isFaqModal}
                onClose={() => setIsFaqModal(false)}
                isLocalFAQ={true}
                saveLocalFaq={(faqItem:FAQItem) => {
                    const faqList : Array<FAQItem> = data.faq ? [...data.faq,faqItem] : [faqItem]
                    inputsHandler(faqList,'faq')
                    setIsFaqModal(false)
                }}
                />
            )
        }
        return (
            <Modal
            title='Creating project'
            onClose={onClose}
            variant={'project'}
            className='creating_project_modal'
        >
            <ProgressWrapper>
                <ProgressNumber defaultValue={1} value={progressValue}>1</ProgressNumber>
                <ProgressNumber defaultValue={2} value={progressValue}>2</ProgressNumber>
                <ProgressNumber defaultValue={3} value={progressValue}>3</ProgressNumber>
                <ProgressNumber defaultValue={4} value={progressValue}>4</ProgressNumber>
                <ProgressNumber defaultValue={5} value={progressValue}>5</ProgressNumber>
                <ProgressNumber defaultValue={6} value={progressValue}>6</ProgressNumber>
                <ProgressNumber defaultValue={7} value={progressValue}>7</ProgressNumber>
                <ProgressNumber defaultValue={8} value={progressValue}>8</ProgressNumber>
            </ProgressWrapper>
            {handleStep()}
            {progressValue === 8 ? (
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
        )
   
    }

    if(loading || isProjectCreating) return <Loader/>

    return (
        handleModal()
    );
};

export default CreatingProjectModal;