import React, {useState} from 'react';
import {useStyles} from './styles';
import StatusDropdown from '../../../../../common/status_dropdown';
import RedFlags from '../../../../../common/red_flags';
import InvestorsRow from '../../../../../common/investors_row';
import Rating from '../../../../../common/rating';
import Button from '../../../../../common/button';
import EditIcon from '../../../../../common/Icons/edit_icon';
import moment from 'moment';
import avatarImage from '../../../../../../assets/img/avatar.png'
import {STATUS_LIST} from '../../../../../../static_content/dropdowns_data';
import DotsButtonWithDropdown from '../../../../../common/dots_button_with_dropdown';
// import CreatingProjectModal from '../../../modals/updating_project';
import {Link} from 'react-router-dom';

const TableRow = () => {
    const {
        wrapper,
        rowWrapper,
        projectWrapper,
        projectImage,
        statusWrapper,
        investorsWrapper,
        ratingWrapper,
        raisedWrapper,
        tagWrapper,
        typeWrapper,
        actionsWrapper,
        flagsWrapper,
        fundingWrapper,
        projectTitle,
        projectDescription,
        dotsAction,
    } = useStyles({status: 'default', rating: 75})

    const [activeStatus, setActiveStatus] = useState<STATUS_LIST>(STATUS_LIST.ACTIVE)
    const [updateProjectModal, setUpdateProjectModal] = useState(false)
    const [addInvestorsModal, setAddInvestorsModal] = useState(false)

    const updateStatus = (value: STATUS_LIST) => {
        setActiveStatus(value)
    }

    return (
        <div className={wrapper}>
            <div className={`${rowWrapper} container`}>
                <Link to={'/gems_lab/accelerator/123'} className={projectWrapper}>
                    <img className={projectImage} src={avatarImage} alt="name"/>
                    <div>
                        <div className={projectTitle}>
                            SharkRace Club <span>75%</span>
                        </div>
                        <div className={projectDescription}>
                            NFT & Collectibles
                        </div>
                    </div>
                </Link>
                <div className={statusWrapper}>
                    <StatusDropdown
                        onChange={updateStatus}
                        activeOption={activeStatus}
                    />
                </div>
                <div className={investorsWrapper}>
                    <InvestorsRow investors={[]}/>
                </div>
                <div className={raisedWrapper}>
                    $1.8M
                </div>
                <div className={fundingWrapper}>
                    {moment().format('MMM d, yyyy')}
                </div>
                <div className={typeWrapper}>
                    Seed
                </div>
                <div className={tagWrapper}>
                    1054 ETH ($1000.05)
                </div>
                <div className={flagsWrapper}>
                    <RedFlags count={14} />
                </div>
                <div className={ratingWrapper}>
                    <Rating rating={94} />
                </div>
                <div className={actionsWrapper}>
                    <Button
                        type='outlined'
                        onClick={() => setUpdateProjectModal(true)}
                    >
                        <EditIcon />
                    </Button>
                    <DotsButtonWithDropdown items={[
                        {title: 'Give red status', onClick: () => console.log(1)},
                        {title: 'Delete', onClick: () => console.log(1)}
                    ]} />
                </div>
            </div>
            {/* {updateProjectModal && <CreatingProjectModal
                onClose={() => setUpdateProjectModal(false)}
                hideModal={() => {
                    setUpdateProjectModal(false)
                    setAddInvestorsModal(true)
                }}
            />}
            {addInvestorsModal && <AddInvestorsModal
                onClose={() => {
                    setAddInvestorsModal(false)
                    setUpdateProjectModal(true)
                }}
                addInvestors={() => {
                    setUpdateProjectModal(true)
                    setAddInvestorsModal(false)
                }}
            />} */}
        </div>
    );
};

export default TableRow;