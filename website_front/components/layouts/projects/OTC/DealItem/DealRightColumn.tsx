import React, { ReactNode, useState } from 'react';
import {
    DealDetailsItem,
    DealButtons,
    DealRightColumn,
    DealRightHeader,
    DealRisk,
    RiskValue,
    DealHeaderWrapper,
    DealRealAssetWrapper,
    DescriptionStatus,
    RealAsset,
    RiskDescriptionWrapper,
    ShareDescriptionWrapper,
    PinDescriptionWrapper,
} from "./styles";
import { DefaultActionWrapper } from '../DealsList/styles';
import { PaperclipWrapper, ShareWrapper } from '../Market/styles';
import RedFlag from '../../../../global/RedFlag';
import { ShareIcon } from '../../../../global/Icons';
import { Paperclip } from 'lucide-react';
import { UserRiskStatus } from '../../../../../types/global_types';
import OtcRealAssetLabel from '../../../../global/common/OtcRealAssetLabel';
import DescriptionComponent from '../../../../global/common/DescriptionComponent';
import ChatIcon from '../../../../global/Icons/ChatIcon';

interface DealRightColumnProps {
    risk: UserRiskStatus;
    redFlags?: number;
    mainDealButton: ReactNode;
    className?: string;
    smartContract?: string
    isRealAsset: boolean
    isPinned: boolean
    isOffer: boolean
    hideMainActionButton?: boolean;
    onShare: () => void;
    onAttach?: () => void;
    onOpenChat: () => void
}

export const DealDetailsComponent = ({
    risk,
    redFlags = 0,
    mainDealButton,
    className = "",
    isRealAsset,
    isPinned,
    isOffer,
    hideMainActionButton = false,
    onShare,
    onAttach,
    onOpenChat,
}: DealRightColumnProps) => {
    const [isRealAssetHover, setIsRealAssetHover] = useState<boolean>(false)
    const [isRiskHover, setIsRiskHover] = useState<boolean>(false)
    const [isShareHover, setIsShareHover] = useState<boolean>(false)
    const [isPinHover, setIsPinHover] = useState<boolean>(false)
    const [isChatHover, setIsChatHover] = useState<boolean>(false)

    const getCurrentRiskText = (risk: UserRiskStatus): string => {
        switch (risk) {
            case "Default":
                return `
                    Risk level is not yet determined. 
                    <br/>
                    <br/>
The user has too little activity on FOMO to evaluate reliability. More completed deals are required to calculate a risk score.
                `;
            case "Low":
                return `
                    Based on the user’s activity and history on FOMO, no suspicious behavior or conflicts were detected. 
                    <br/>
                    <br/>
The user has stable deal patterns, no disputes and a clean reputation across previous transactions.
                `;
            case "Medium":
                return `
                Some risk indicators were detected: limited history, irregular activity or minor inconsistencies in past deals.
                <br/>
                <br/>
Not critical but caution is recommended before proceeding.
                `;
            case "High":
                return `
                    Several strong risk factors were flagged. User may have unresolved disputes, canceled deals or patterns typical for high-risk behavior. 
                    <br/>
                    <br/>
Proceed only if fully confident.
                `;
            default:
                return "Risk level not defined";
        }
    }

    return (
        <DealRightColumn className={`right-column ${className}`}>
            <DealHeaderWrapper>
                <DealRightHeader>
                    <DealRisk>
                        <DealDetailsItem
                            onMouseEnter={() => setIsRiskHover(true)}
                            onMouseLeave={() => setIsRiskHover(false)}
                        >
                            <span>Risk:</span>
                            <RiskValue risk={risk}>
                                {risk}
                            </RiskValue>
                        </DealDetailsItem>
                        <RiskDescriptionWrapper
                            isVisible={isRiskHover}
                        >
                            <DescriptionComponent
                                className='risk'
                                isVisible={isRiskHover}
                                date={new Date()}
                                isDate={false}
                                text={getCurrentRiskText(risk)}
                            />
                        </RiskDescriptionWrapper>
                    </DealRisk>
                    <DefaultActionWrapper>
                        <span>
                            <RedFlag count={redFlags} />
                        </span>
                    </DefaultActionWrapper>
                    {
                        !isOffer
                            ?
                            <>
                                <DealRealAssetWrapper>
                                    <ShareWrapper
                                        onMouseEnter={() => setIsShareHover(true)}
                                        onMouseLeave={() => setIsShareHover(false)}
                                        onClick={onShare}>
                                        <ShareIcon fill="#04A584" />
                                    </ShareWrapper>
                                    <ShareDescriptionWrapper isVisible={isShareHover}>
                                        <DescriptionComponent
                                            className='risk'
                                            isVisible={isShareHover}
                                            date={new Date()}
                                            isDate={false}
                                            text={'Share this deal with others'}
                                        />
                                    </ShareDescriptionWrapper>
                                </DealRealAssetWrapper>
                                <DealRealAssetWrapper>
                                    <PaperclipWrapper
                                        onMouseEnter={() => setIsPinHover(true)}
                                        onMouseLeave={() => setIsPinHover(false)}
                                        onClick={onAttach}>
                                        <Paperclip color={isPinned ? 'var(--main-green)' : "var(--main-gray)"} width={20} height={20} />
                                    </PaperclipWrapper>
                                    <PinDescriptionWrapper isVisible={isPinHover}>
                                        <DescriptionComponent
                                            className='risk'
                                            isVisible={isPinHover}
                                            date={new Date()}
                                            isDate={false}
                                            text={isPinned ? "Unpin deal from top" : "Pin deal to top"}
                                        />
                                    </PinDescriptionWrapper>
                                </DealRealAssetWrapper>
                                <DealRealAssetWrapper>
                                    <button
                                        onClick={onOpenChat}
                                        onMouseEnter={() => setIsChatHover(true)}
                                        onMouseLeave={() => setIsChatHover(false)}
                                        className='chat-btn'>
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4.5 4.5H9.3M4.5 7.7H7.3M13.3 6.9C13.3 7.82002 13.1059 8.69469 12.7563 9.4853L13.3012 13.2994L10.0326 12.4822C9.10663 13.003 8.038 13.3 6.9 13.3C3.36538 13.3 0.5 10.4346 0.5 6.9C0.5 3.36538 3.36538 0.5 6.9 0.5C10.4346 0.5 13.3 3.36538 13.3 6.9Z" stroke="#05A584" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <PinDescriptionWrapper className='chat' isVisible={isChatHover}>
                                        <DescriptionComponent
                                            className='chat'
                                            isVisible={isChatHover}
                                            date={new Date()}
                                            isDate={false}
                                            text={'Open chat'}
                                        />
                                    </PinDescriptionWrapper>
                                </DealRealAssetWrapper>
                            </>
                            :
                            <></>
                    }
                </DealRightHeader>
                {
                    isRealAsset
                        ?
                        <DealRealAssetWrapper>
                            <OtcRealAssetLabel
                                onHover={(value: boolean) => setIsRealAssetHover(value)}
                            />
                            <RealAsset isVisible={isRealAssetHover}>
                                <DescriptionComponent
                                    className='real-asset'
                                    isVisible={isRealAssetHover}
                                    date={new Date()}
                                    isDate={false}
                                    text={'This deal includes the transfer of a real asset (NFT, whitelist, token, etc.)'}
                                />
                            </RealAsset>
                        </DealRealAssetWrapper>
                        :
                        <></>
                }
            </DealHeaderWrapper>
            {
                !hideMainActionButton && (
                    <DealButtons>{mainDealButton}</DealButtons>
                )
            }
        </DealRightColumn>
    );
};