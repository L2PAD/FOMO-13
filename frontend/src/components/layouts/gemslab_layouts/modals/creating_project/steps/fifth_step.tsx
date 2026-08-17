import { useState } from 'react';
import TextModal from '../../../../../common/text_modal/TextModal';
import { IProject } from '../../../../../hooks/useCreateProject';
import Button from '../../../../../common/button';
import { useStyles } from './styles';

type TextKeys = 'descriptionText' 
| 'overviewText' 
| 'tokenUtilityText'
| 'revenueText'
| 'stakingText'
| 'purchaseText'
| 'distributionText'


const FifthStep = ({data,inputsHandler,modalHandler}: {data:IProject,inputsHandler:any,modalHandler:any}) => {
    const {
        buttonsWrapper
    } = useStyles()

    return (
        <>
        <div className={buttonsWrapper}>
            <Button
            type={'bordered'}
            onClick={() => modalHandler('descriptionText')} 
            >
                Description
            </Button>
            <Button
            type={'bordered'}
            onClick={() => modalHandler('overviewText')} 
            >
                Overview
            </Button>
            <Button
            type={'bordered'}
            onClick={() => modalHandler('tokenUtilityText')} 
            >
                Token Utility
            </Button>
            <Button
            type={'bordered'}
            onClick={() => modalHandler('revenueText')} 
            >
                Revenue
            </Button>
            <Button
            type={'bordered'}
            onClick={() => modalHandler('stakingText')} 
            >
                Staking
            </Button>
            <Button
            type={'bordered'}
            onClick={() => modalHandler('purchaseText')} 
            >
                Purchase
            </Button>
            <Button
            type={'bordered'}
            onClick={() => modalHandler('distributionText')} 
            >
                Distribution
            </Button>
      
        </div>

        </>
    );
};

export default FifthStep;