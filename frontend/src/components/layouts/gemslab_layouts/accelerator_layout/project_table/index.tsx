import React from 'react';
import TableRow from './table_row';
import {useStyles} from './styles';

const ProjectTable = () => {
    const {
        wrapper,
        headerWrapper,
        projectsCell,
        statusCell,
        investorsCell,
        raisedCell,
        fundingCell,
        typeCell,
        priceCell,
        flagsCell,
    } = useStyles()

    return (
        <>
            <div className={wrapper}>
                <div className={`${headerWrapper} container`}>
                    <div className={projectsCell}>
                        Projects
                    </div>
                    <div className={statusCell}>
                        Status
                    </div>
                    <div className={investorsCell}>
                        Investors
                    </div>
                    <div className={raisedCell}>
                        Total Raised
                    </div>
                    <div className={fundingCell}>
                        Last Funding
                    </div>
                    <div className={typeCell}>
                        Type
                    </div>
                    <div className={priceCell}>
                        Price
                    </div>
                    <div className={flagsCell}>
                        Red flags
                    </div>
                </div>
            </div>
            <div>
                <TableRow />
                <TableRow />
                <TableRow />
                <TableRow />
                <TableRow />
                <TableRow />
                <TableRow />
                <TableRow />
            </div>
        </>
    );
};

export default ProjectTable;