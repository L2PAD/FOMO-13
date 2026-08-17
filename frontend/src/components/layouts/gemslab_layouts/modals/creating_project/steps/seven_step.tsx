import { useState } from 'react';
import TextModal from '../../../../../common/text_modal/TextModal';
import { IProject } from '../../../../../hooks/useCreateProject';
import Button from '../../../../../common/button';
import { useStyles } from './styles';
import { FAQItem } from '../../../../settings_layout/FAQ_layout';
import DeleteIcon from '../../../../../common/Icons/delete_icon';
import {ModalRow} from '../styles';

type TextKeys = 'descriptionText' 
| 'overviewText' 
| 'tokenUtilityText'
| 'revenueText'
| 'stakingText'
| 'purchaseText'
| 'distributionText'


const SevenStep = ({data,inputsHandler,modalHandler}: {data:IProject,inputsHandler:any,modalHandler:any}) => {
    const {
        faqItems,
        faqItem,
        faqItemBody,
        faqItemRemove
    } = useStyles()

    const removeFAQItem = (index:number) => {
        const filteredFAQItems : Array<FAQItem> | undefined
        =
        data.faq?.filter((item:FAQItem,i:number) => index !== i)

        inputsHandler(filteredFAQItems,'faq')
    }

    return (
        <>
        <div className={faqItems}>
            {
                data?.faq?.length
                ?
                data.faq.map((item:FAQItem,index:number) => {
                    return (
                        <div
                        className={faqItemBody}
                        key={index}>
                            <div className={faqItem}>
                                <div>
                                    <p>Title:</p>
                                    {item.title}
                                </div>
                                <div>
                                    <p>Subtitle:</p>
                                    {item.title}
                                </div>
                                <div>
                                    <p>Items:</p>
                                    {item.items.length}
                                </div>
                            </div>
                            <button
                            onClick={() => removeFAQItem(index)}
                            className={faqItemRemove}
                            >
                                <DeleteIcon/>
                            </button>
                        </div>
                    )
                })
                :
                <></>
            }
            <Button
            type={'bordered'}
            onClick={() => modalHandler('descriptionText')} 
            >
                Add FAQ
            </Button>
        </div>

        </>
    );
};

export default SevenStep;