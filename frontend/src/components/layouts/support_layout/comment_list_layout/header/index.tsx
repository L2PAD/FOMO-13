import {useState} from 'react';
import SortBy from '../../../../common/sort_by_messages';
import SearchBar from '../../../../common/searchMessages';
import {useStyles} from './styles';

const CommentsHeader = () => {
    const [isCreatingModal, setIsCreatingModal] = useState(false)
    const [isAddInvestorsModal, setIsAddInvestorsModal] = useState(false)
    const [hideStepsModal, setHideStepsModal] = useState(false)

    const {
        wrapper,
        leftWrapper,
        mainTitle,
        searchWrapper,
        searchInput,
        creatingModalWrapper,
    } = useStyles({isCreatingModal})

    return (
        <>
            <div className={wrapper}>
                <div className={leftWrapper}>
                    <h1 className={mainTitle}>
                        Comments
                    </h1>
                    <SearchBar/>
                    <SortBy />
                </div>
            </div>
        </>
    );
};

export default CommentsHeader;