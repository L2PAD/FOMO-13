import React, { useState } from 'react';
import {useStyles} from './styles';
import Button from '../../../common/button';
import SortBy from '../../../common/sort_by';
import Checkbox from '../../../common/checkbox';

export interface IStatisticFilterOptions {
    new:boolean,
    owners:boolean,
    investors:boolean,
    online:boolean,
}

const Header = () => {
    const {
        wrapper,
        leftWrapper,
        mainTitle,
        actionsWrapper,
        chooseWrapper,
        checkboxWrapper,
    } = useStyles()

    const [filterOptions,setFilterOptions] = useState<IStatisticFilterOptions>(
        {new:false,owners:false,investors:false,online:false}
    )

    const filterHandler = (name:string) : void => {
        setFilterOptions((prev) => {
            // @ts-ignore
            const value = prev[name]
            return (
                {...prev,[name]:!value}
            )
        })
    }

    return (
        <div className={wrapper}>
            <div className={leftWrapper}>
                <h1 className={mainTitle}>
                    Statistics
                </h1>
            </div>
            <div className={actionsWrapper}>
                <div className={checkboxWrapper}>
                    <Checkbox
                        onChange={() => filterHandler('new')}
                        active={filterOptions.new}
                    />
                    New users
                </div>
                <div className={checkboxWrapper}>
                    <Checkbox
                        onChange={() => filterHandler('owners')}
                        active={filterOptions.owners}
                    />
                    Owners
                </div>
                <div className={checkboxWrapper}>
                    <Checkbox
                        onChange={() => filterHandler('investors')}
                        active={filterOptions.investors}
                    />
                    Investors
                </div>
                <div className={checkboxWrapper}>
                    <Checkbox
                        onChange={() => filterHandler('online')}
                        active={filterOptions.online}
                    />
                    Online
                </div>
                <SortBy />
                <p className={chooseWrapper}>
                    Choose: <span>0</span>
                </p>
                <Button type='bordered' onClick={() => console.log(1)}>
                    Export Excel
                </Button>
            </div>
        </div>
    );
};

export default Header;