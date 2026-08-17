import React, {FC, useState} from 'react';
import {PieChart, Pie, Cell} from 'recharts';
import {useStyles} from './styles';
import EditIcon from '../../../../../common/Icons/edit_icon';
import moment from 'moment';
import AssetTable from '../../../../../common/asset_table';
import TokenAllocationModal from '../../../modals/token_allocation_modal';
import TokenMetricsModal from '../../../modals/token_metrics_modal';
import { useDispatch, useSelector } from 'react-redux';
import { IProject } from '../../../../../hooks/useCreateProject';
import AddRoundModal from '../../../modals/add_round_modal';
import { AddButton } from '../../../modals/token_allocation_modal/styles';
import { IRoundItem } from '../../../../../types/global_types';
import { clarifyAmount } from '../../../../../utils/clarifyAmount';
import { CloseIcon } from '../../../../../../assets';
import { editProject } from '../../../../../../store/slices/editProjectSlice';

const data = [
    { name: 'Marketing &  Partner support', value: 8 },
    { name: 'Team', value: 15 },
    { name: 'Community rewards', value: 32 },
    { name: 'Token Sale', value: 45 },
];

const COLORS = ['#58FFAF', '#58D7FF', '#FF5858', '#FFDA58'];

const FundraisingTab : FC<{
    isEditState:boolean,
    isEndedProject?:boolean
}> = ({isEditState,isEndedProject}) => {
    const {
        newsRowWrapper,
        newsWrapper,
        newsTitle,
        contentRow,
        editWrapper,
        titleWrapper,
        contentWrapper,
        chartWrapper,
        colorCircle,
        dataRow,
        totalsRow,
        metricsWrapper,
        metricRow,
        longMetricRow,
        addRoundWrapper,
        removeItem
    } = useStyles()
    const dispatch = useDispatch() 
    const project : IProject = useSelector((state:any) => state.editProject.project)
    const [isAddRound,setIsAddRound] = useState<boolean>(false)
    const [tokenAllocationModal, setTokenAllocationModal] = useState(false)
    const [tokenMetricsModal, setTokenMetricsModal] = useState(false)

    const removeRoundItem = (id:number) : void => {
        const filteredItems : Array<IRoundItem>
        =
        project?.fundraising?.filter((item:IRoundItem,i:number) => i !== id) 
        || 
        []

        dispatch(editProject({key:'fundraising',value:filteredItems}))
    }

    return (
        <div>
            <div className={newsRowWrapper}>
                {
                    project.fundraising?.length
                    ?
                    project.fundraising.map((fundraisingItem:IRoundItem,index) => {
                        return (
                            <div key={index} className={newsWrapper}>
                                <div className={newsTitle}>
                                    Funding Round
                                </div>
                                <div className={contentRow}>
                                    <div>
                                        {moment(fundraisingItem.date).format('MMMM YYYY')}
                                    </div>
                                    <div>
                                        Price: <span>${clarifyAmount(fundraisingItem.price)}</span>
                                    </div>
                                </div>
                                <div className={contentRow}>
                                    <div>
                                        Raised: <span>${clarifyAmount(fundraisingItem.raised)}</span>
                                    </div>
                                    <div>
                                        Pre-Valuation: <span>${clarifyAmount(fundraisingItem.preValuation)}</span>
                                    </div>
                                </div>
                                {
                                    isEditState
                                    ?
                                    <button
                                    onClick={() => removeRoundItem(index)}
                                    className={removeItem}
                                    >
                                        <CloseIcon/>
                                    </button>
                                    :
                                    <></>
                                }
                            </div>
                        )
                    })
                    :
                    <>Fundraising empty...</>
                }
                {
                    isEditState
                    ?
                    <div className={addRoundWrapper}>
                        <AddButton 
                        onClick={() => setIsAddRound(true)}
                        >
                            + Add round
                        </AddButton>
                    </div>
                    :
                    <></>
                }
            </div>
            {
                isEndedProject
                ?
                <div className={contentWrapper}>
                    <div>
                    <div className={titleWrapper}>
                        Token Allocation 
                        {
                            isEditState
                            ?
                            <EditIcon onClick={() => setTokenAllocationModal(true)} />
                            :
                            <></>
                        }
                    </div>
                    <div className={chartWrapper}>
                        <div>
                            {
                                project.totalAllocation?.length
                                ?
                                <PieChart width={184} height={184}>
                                <Pie
                                    data={project.totalAllocation}
                                    innerRadius={35}
                                    outerRadius={92}
                                    paddingAngle={0}
                                    dataKey="value"
                                >
                                    {project.totalAllocation.map((entry, index) => (
                                        <Cell 
                                        key={`cell-${index}`} 
                                        fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                            :
                            <>Allocations empty...</>
                            }

                        </div>
                        <div>
                            <div className={totalsRow}>
                                Total Tokens Supply: <span>{project.totalSupply || '0'}</span>
                            </div>
                            <div className={totalsRow}>
                                Tokens For Sale: <span>{project.totalForSale || '0'} <i>(0%)</i></span>
                            </div>
                            <div>
                                {
                                project.totalAllocation?.length
                                ?
                                project.totalAllocation.map((item, i) => (
                                    <div key={i} className={dataRow}>
                                        <div
                                            className={colorCircle}
                                            style={{background: COLORS[i]}}
                                        /> <span>{item.value}%</span> - {item.name}
                                    </div>
                                ))
                                :
                                <></>
                            }
                            </div>
                        </div>
                    </div>
                    </div>
                    <div>
                    <div className={titleWrapper}>
                        Token Metrics 
                        {
                            isEditState
                            ?
                            <EditIcon onClick={() => setTokenMetricsModal(true)}/>
                            :
                            <></>
                        }
                    </div>
                    <div className={metricsWrapper}>
                        <div>
                            <div className={metricRow}>
                                <div>
                                    Ticket:
                                </div>
                                <div>
                                    {project.tokenMetrics?.ticket || '-'}
                                </div>
                            </div>
                            <div className={metricRow}>
                                <div>
                                    Token Type:
                                </div>
                                <div>
                                    {project.tokenMetrics?.tokenType || '-'}
                                </div>
                            </div>
                            <div className={metricRow}>
                                <div>
                                    ICO Token Price:
                                </div>
                                <div>
                                {project.tokenMetrics?.tokenPrice || '-'}
                                </div>
                            </div>
                            <div className={metricRow}>
                                <div>
                                    Pre-sale price:
                                </div>
                                <div>
                                {project.tokenMetrics?.preSale || '-'}
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className={longMetricRow}>
                                <div>
                                    KYC:
                                </div>
                                <div>
                                {project.tokenMetrics?.KYC || '-'}
                                </div>
                            </div>
                            <div className={longMetricRow}>
                                <div>
                                    Whitelist:
                                </div>
                                <div>
                                {project.tokenMetrics?.whitelist || '-'}
                                </div>
                            </div>
                            <div className={longMetricRow}>
                                <div>
                                    Min/Max Personal Cap:
                                </div>
                                <div>
                                    {project.tokenMetrics?.personalCap || '-'}
                                </div>
                            </div>
                            <div className={longMetricRow}>
                                <div>
                                    Accepts:
                                </div>
                                <div>
                                    {project.tokenMetrics?.accepts || '-'}
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
                :
                <></>
            }
            <div>
                <AssetTable assets={project.assets}/>
            </div>
            {
                tokenAllocationModal 
                ?
                <TokenAllocationModal onClose={() => setTokenAllocationModal(false)} />
                :
                <></>
            }
            {
                tokenMetricsModal
                ?
                <TokenMetricsModal onClose={() => setTokenMetricsModal(false)} />
                :
                <></>
            }
            {
                isAddRound
                ?
                <AddRoundModal
                onClose={() => setIsAddRound(false)}
                />
                :
                <></>
            }
        </div>
    );
};

export default FundraisingTab;