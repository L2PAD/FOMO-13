import React from 'react';
import TableRow from './table_row';
import EditIcon from '../../../../../common/Icons/edit_icon';
import {useStyles} from './styles';
import { IProject } from '../../../../../hooks/useCreateProject';
import { useSelector } from 'react-redux';

const ExchangesTab = () => {
    const project : IProject = useSelector((state:any) => state.editProject.project) 

    const {
        editMainWrapper,
        headerWrapper,
        exchangeWrapper,
        pairWrapper,
        percentVolumeWrapper,
        priceWrapper,
        updatedWrapper,
        volumeWrapper
    } = useStyles()

    return (
        <div>
            <div className={editMainWrapper}>
                <EditIcon /> Edit and settings
            </div>
            <div className={headerWrapper}>
                <div className={exchangeWrapper}>Exchange</div>
                <div className={pairWrapper}>Trading pair</div>
                <div className={priceWrapper}>Price</div>
                <div className={volumeWrapper}> 24H Volume</div>
                <div className={percentVolumeWrapper}>% Volume</div>
                <div className={updatedWrapper}>Updated</div>
            </div>
            {
                project?.exchange?.length
                ?
                project?.exchange.map((exchangeItem,index) => {
                    return <TableRow key={index}/>
                })
                :
                <>Exchange empty...</>
            }
        </div>
    );
};

export default ExchangesTab;