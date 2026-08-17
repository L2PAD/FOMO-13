import React, {useState} from 'react';
import {TelegramIcon} from '../../../../../assets'
import {
    SearchWrapper,
    HeaderWrapper,
    ContentWrapper,
    useStyles,
} from './styles';
import {PageDescription, PageDescriptionWrapper} from '../styles';
import {HeaderSwitchWrapper, SwitchButton} from '../TopMembers/styles';
import Filter from '../../../../common/filter';
import SortBy from '../../../../common/sort_by';
import SearchIcon from '../../../../common/Icons/search_icon';
import Item from './item';
import EditIcon from '../../../../common/Icons/edit_icon';
import DescriptionModal from '../../../../common/global_modals/description_modal';

const Sell = () => {
    const [topUser, setTopUsers] = useState(true)
    const [isBioModal, setIsBioModal] = useState(false)

    const {
        searchWrapper,
        searchInput,
    } = useStyles()

    return (
        <div>
            <HeaderSwitchWrapper>
                <SwitchButton
                    onClick={() => setTopUsers(true)}
                    active={topUser}
                >
                    Top users
                </SwitchButton>
                <SwitchButton
                    onClick={() => setTopUsers(false)}
                    active={!topUser}
                >
                    Comments
                </SwitchButton>
            </HeaderSwitchWrapper>
            <SearchWrapper>
                <div className={searchWrapper}>
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder='Search'
                        className={searchInput}
                    />
                </div>
            </SearchWrapper>
            <HeaderWrapper>
                <Filter />
                <SortBy />
            </HeaderWrapper>
            <PageDescriptionWrapper>
                <PageDescription variant="p">
                    <span>Bio:</span> <i onClick={() => setIsBioModal(true)}><EditIcon /></i> Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit
                    officia consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud amet. Amet
                    minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis
                    enim velit mollit.
                    <a href="components/layouts/projects/OTC/Sell#">
                        <TelegramIcon fill="#04A584" />
                        Telegram chat
                    </a>
                </PageDescription>
            </PageDescriptionWrapper>
            <ContentWrapper>
                <Item />
                <Item />
                <Item />
                <Item />
            </ContentWrapper>
            {isBioModal && <DescriptionModal onClose={() => setIsBioModal(false)} />}
        </div>
    );
};

export default Sell;