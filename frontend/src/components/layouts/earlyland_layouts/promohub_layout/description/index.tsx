import React, {useState} from 'react';
import articleImage from '../../../../../assets/img/article.png'
import EditIcon from '../../../../common/Icons/edit_icon';
import {useStyles} from './styles';
import Button from '../../../../common/button';
import MainDataModal from '../../modals/main_data_modal';
import PromoModal from '../../modals/promo_modal';

const Description = () => {
    const {
        wrapper,
        articleWrapper,
        articleText,
        editWrapper,
        underWrapper,
        timerWrapper,
        timerEditWrapper,
        timerTitle,
        timerStatus,
        timerContribution,
        timerValue,
        actionWrapper,
    } = useStyles()

    const [mainDataModal, setMainDataModal] = useState(false)
    const [promoModal, setPromoModal] = useState(false)

    return (
        <div className={wrapper}>
            <div className={articleWrapper}>
                <img src={articleImage} alt=""/>
                <div>
                    <div className={articleText}>
                        The Contributor Program is a community incentive program designed to encourage community
                        members of different backgrounds and skillsets to steward and take ownership of key aspects
                        of the ecosystem. Participants of the program will be given points based on the quality of
                        their contributions to the ecosystem using evaluation criteria developed by existing leaders
                        in the community.
                        <br/><br/>
                        When the NEXT token goes live, the project plans to submit a proposal to the Connext DAO to
                        retroactively reward participants proportional to points received.
                        <br/><br/>
                        The program starts on the 20th of April 2022. Phase One of the program will run until the NEXT
                        token launches. After the token and DAO are live, the taem expects to continue with further
                        phases of the program.
                    </div>
                    <div className={editWrapper} onClick={() => setMainDataModal(true)}>
                        <EditIcon /> Edit description
                    </div>
                </div>
            </div>
            <div className={underWrapper}>
                <img src={articleImage} alt=""/>
                <div className={timerWrapper}>
                    <div className={timerEditWrapper} onClick={() => setPromoModal(true)}>
                        <EditIcon /> Edit description
                    </div>
                    <div>
                        <p className={timerTitle}>SharkRace Club</p>
                        <div className={timerStatus}>Public sho</div>
                        <div className={timerContribution}>Contribution Closes</div>
                        <div className={timerValue}>1d 2h 48m 43s</div>
                        <Button
                            onClick={() => console.log(1)}
                            type='fill'
                            className={actionWrapper}
                        >
                            See details
                        </Button>
                    </div>
                </div>
            </div>
            {mainDataModal && <MainDataModal onClose={() => setMainDataModal(false)} />}
            {promoModal && <PromoModal onClose={() => setPromoModal(false)} />}
        </div>
    );
};

export default Description;