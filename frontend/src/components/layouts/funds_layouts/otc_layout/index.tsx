import React, {useState} from 'react';
import {TelegramIcon} from '../../../../assets'
import {PageContent, PageDescription, PageDescriptionWrapper, PageWrapper, TabsContentWrapper} from './styles';
import Buy from './Buy';
import Sell from './Sell';
import Market from './Market';
import TopMembers from './TopMembers';
import MyDeals from './MyDeals';
import Tabs from '../../../common/tabs';
import EditIcon from '../../../common/Icons/edit_icon';
import DescriptionModal from '../../../common/global_modals/description_modal';

const tabs = ['Buy', 'Sell', 'Market', 'Top members', 'My deals']

const OTCLayout = () => {
    const [activeTab, setActiveTab] = useState(tabs[0])
    const [isBioModal, setIsBioModal] = useState(false)

    const renderTabsContent = () => {
        switch(activeTab) {
        case 'Buy':
            return <Buy />;
        case 'Sell':
            return <Sell />;
        case 'Market':
            return <Market />;
        case 'Top members':
            return <TopMembers />;
        case 'My deals':
            return <MyDeals />;
        default:
            return null;
        }
    }

    return (
        <PageWrapper>
            <PageDescriptionWrapper>
                <PageDescription variant="p">
                    <span>Bio:</span> <i onClick={() => setIsBioModal(true)}><EditIcon /></i> Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit
                    officia consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud amet. Amet
                    minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis
                    enim velit mollit.
                    <a href="#">
                        <TelegramIcon fill="#04A584" />
                        Telegram chat
                    </a>
                </PageDescription>
            </PageDescriptionWrapper>
            <PageContent>
                <Tabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onChange={(value) => setActiveTab(value)}
                />
                <TabsContentWrapper>
                    {renderTabsContent()}
                </TabsContentWrapper>
            </PageContent>
            {isBioModal && <DescriptionModal onClose={() => setIsBioModal(false)} />}
        </PageWrapper>
    );
};

export default OTCLayout;