import React from 'react';
import { useStyles } from './styles';
import TableRow from './table_row';
import { IDeal } from '../../../../types/global_types';
import { adminCompleteDealETH, adminCompleteDealUSDC } from '../../../../smart/smartOtc';
import dealAction from '../../../../services/deals/dealAction';
import { toast } from 'react-toastify';

interface UsersTableProps {
    deals: IDeal[];
    isFetching: boolean;
    total: number;
    bottomRef: React.RefObject<HTMLDivElement>;
}

const UsersTable: React.FC<UsersTableProps> = ({ deals, isFetching, total, bottomRef }) => {

    const confirmCompleteDeal = async (deal: IDeal, isReturn: boolean): Promise<void> => {
        const smartResult =
            deal.ticker.toLowerCase() === 'eth'
                ? await adminCompleteDealETH(deal.dealId, isReturn)
                : await adminCompleteDealUSDC(deal.dealId, isReturn);

        if (smartResult?.isSuccess) {
            await dealAction('complete/forcedly', deal._id, 'POST');
        } else {
            toast.error(<div>
                <h4>Smart Contract Error!</h4>
                <p>Admin wallet required</p>
            </div>)
        }
    };

    const {
        wrapper,
        headerWrapper,
        statusWrapper,
        userWrapper,
        walletWrapper,
        pointsWrapper,
        dealsLoading,
    } = useStyles();

    return (
        <div className={wrapper}>
            <div className={`container ${headerWrapper}`}>
                <div className={pointsWrapper}>Deal Name</div>
                <div className={userWrapper}>Deal Creator</div>
                <div className={userWrapper}>Buyer/Seller</div>
                <div className={walletWrapper}>Creator Address</div>
                <div className={walletWrapper}>Buyer/Seller Address</div>
                <div className={statusWrapper}>Status</div>
                <div className={pointsWrapper}>Price</div>
                <div className={pointsWrapper}>Service Type</div>
                <div className={pointsWrapper}>Amount</div>
                <div className={pointsWrapper}>Asset Type</div>
            </div>
            <div>
                {deals.map((item: IDeal) => (
                    <TableRow
                        key={item._id}
                        deal={item}
                        confirmCompleteDeal={confirmCompleteDeal}
                    />
                ))}
            </div>
            <div
                ref={bottomRef}
                style={{ height: '1px', margin: '20px 0', backgroundColor: 'transparent' }}
            />
            {isFetching && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    Loading more deals...
                </div>
            )}
            {/* {
                total === deals.length || total < deals.length
                    ?
                    (
                        <div className={dealsLoading}>
                            All deals loaded
                        </div>
                    )
                    :
                    <></>
            } */}
        </div>
    );
};

export default UsersTable;
