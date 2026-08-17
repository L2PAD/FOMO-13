import {FC} from 'react';
import TableRow from './table_row';
import {useStyles} from './styles';
import { IAsset } from '../../types/global_types';

interface IProps {
    assets: Array<IAsset> | undefined
}

const AssetTable : FC<IProps> = ({assets}) => {
    const {
        headerWrapper,
        assetWrapper,
        lastWrapper,
        stageWrapper,
        upcomingWrapper,
        privateWrapper,
        publicWrapper,
        seedWrapper,
        strategicWrapper,
        tokenWrapper,
    } = useStyles()

    return (
        <div>
            <div className={headerWrapper}>
                <div className={assetWrapper}>Asset</div>
                <div className={tokenWrapper}>Token supply</div>
                <div className={publicWrapper}>Public vesting</div>
                <div className={seedWrapper}>Seed vesting</div>
                <div className={privateWrapper}>Private vesting</div>
                <div className={strategicWrapper}>Strategic vesting</div>
                <div className={stageWrapper}>Stage</div>
                <div className={upcomingWrapper}>Upcoming event</div>
                <div className={lastWrapper}>Last event</div>
            </div>
            <div>
                {
                    assets?.length
                    ?
                    assets.map((asset,index) => {
                        return <TableRow key={index}/>
                    })
                    :
                    <>Assets empty...</>
                }
            </div>
        </div>
    );
};

export default AssetTable;