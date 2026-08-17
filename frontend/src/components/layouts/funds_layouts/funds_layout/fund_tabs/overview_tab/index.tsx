import {FC} from 'react';
import EditIcon from '../../../../../common/Icons/edit_icon';
import {useStyles} from './styles';
import { IProject } from '../../../../../hooks/useCreateProject';
import { useSelector } from 'react-redux';

const OverviewTab  = () => {
    const project : IProject = useSelector((state:any) => state.editProject.project)


    const {
        graphicWrapper,
        graphicTopWrapper,
        graphicTopTitle,
        graphicTopRow,
        graphicTopCell,
        graphicBottomRow,
        graphicBottomRowTitle,
        graphicBottomRowValue,
    } = useStyles()

    return (
        <div className={graphicWrapper}>
            <div />
            <div>
                <div className={graphicTopWrapper}>
                    <div className={graphicTopTitle}>
                        ROI since ICO
                    </div>
                    <div className={graphicTopRow}>
                        <div className={graphicTopCell}>
                            <div>
                                USD
                            </div>
                            <span className='green'>
                                    0.00x
                                </span>
                        </div>
                        <div className={graphicTopCell}>
                            <div>
                                BTC
                            </div>
                            <span>
                                    0.00x
                                </span>
                        </div>
                        <div className={graphicTopCell}>
                            <div>
                                ETH
                            </div>
                            <span className='red'>
                                    0.00x
                                </span>
                        </div>
                    </div>
                </div>
                <div className={graphicTopWrapper}>
                    <div className={graphicTopTitle}>
                        Price Statistics
                    </div>
                    <div className={graphicBottomRow}>
                        <div className={graphicBottomRowTitle}>
                            Price
                        </div>
                        <div className={graphicBottomRowValue}>
                            {project.price || '0'}
                        </div>
                    </div>
                    <div className={graphicBottomRow}>
                        <div className={graphicBottomRowTitle}>
                            24h Change
                        </div>
                        <div className={`${graphicBottomRowValue} green`}>
                            $0.000
                            <span>00.00%</span>
                        </div>
                    </div>
                    <div className={graphicBottomRow}>
                        <div className={graphicBottomRowTitle}>
                            Market Cap
                        </div>
                        <div className={graphicBottomRowValue}>
                            $00.00 M
                        </div>
                    </div>
                    <div className={graphicBottomRow}>
                        <div className={graphicBottomRowTitle}>
                            Volume 24h
                        </div>
                        <div className={graphicBottomRowValue}>
                            {project.volumeGrowth || '0'}%
                            <span className='green'>{project.volumeGrowth || '0'}%</span>
                        </div>
                    </div>
                    <div className={graphicBottomRow}>
                        <div>
                            <div className={graphicBottomRowTitle}>
                                All-Time High
                            </div>
                            <span>Jan 11, 2022</span>
                        </div>
                        <div className={graphicBottomRowValue}>
                            {project.highPrice || '0'}%
                            <span className='green'>{project.highPrice || '0'}%</span>
                        </div>
                    </div>
                    <div className={graphicBottomRow}>
                        <div>
                            <div className={graphicBottomRowTitle}>
                                All-Time Low
                            </div>
                            <span>Jan 10, 2022</span>
                        </div>
                        <div className={graphicBottomRowValue}>
                            ${project.lowPrice || '0'}
                            <span className='red'>{project.lowPrice || '0'}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;