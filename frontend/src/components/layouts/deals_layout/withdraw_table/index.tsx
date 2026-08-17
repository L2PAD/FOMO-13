import React, { FC, useState, useEffect, useCallback } from 'react';
import { useStyles, Wrapper } from './styles';
import { IWithdraw } from '../../../types/global_types';
// import Loader from '../../Loader';
import Checkbox from '../../../common/checkbox';
import TableRow from './row';
import { approveWithdraw, rejectWithdraw } from '../../../services/deals/updateWithdrawStatus';
import { toast } from 'react-toastify';

interface IProps {
    refetch: any
    withdrawItems: IWithdraw[]
}

const WithdrawTable: FC<IProps> = ({ withdrawItems, refetch }) => {
    const [isUpdateModal, setIsUpdateModal] = useState(false);
    const [isSelectAll, setIsSelectAll] = useState<boolean>(false);

    const {
        wrapper,
        headerWrapper,
        checkboxWrapper,
        userWrapper,
        amountWrapper,
        currencyWrapper,
        networkWrapper,
        statusWrapper,
        dateWrapper,
        reasonWrapper,
        fomoIdWrapper,
        transactionWrapper,
        actionsWrapper
    } = useStyles();

    const selectAll = () => {
        setIsSelectAll((prev) => !prev);
    };


    const selectWithdraw = (id: string) => {
        console.log(id)
    }

    const confirmApporove = async (id: string): Promise<void> => {
        const { isSuccess } = await approveWithdraw(id)
        if (isSuccess) {
            toast.success('Withdraw Approved!')
            await refetch()
        } else {
            toast.success('Withdraw approve error')
        }
    }

    const confirmReject = async (id: string): Promise<void> => {
        const { isSuccess } = await rejectWithdraw(id)
        if (isSuccess) {
            toast.success('Withdraw Rejected!')
            await refetch()
        } else {
            toast.success('Withdraw reject error')
        }
    }


    return (
        <Wrapper>
            <div className={`${headerWrapper}`}>
                {/* <div className={checkboxWrapper}>
                    <Checkbox
                        onChange={selectAll}
                        active={isSelectAll}
                    />
                </div> */}
                <div className={userWrapper}>User</div>
                <div className={amountWrapper}>Amount</div>
                <div className={currencyWrapper}>Currency</div>
                <div className={networkWrapper}>Network</div>
                <div className={statusWrapper}>Status</div>
                <div className={dateWrapper}>Created Date</div>
                <div className={fomoIdWrapper}>FOMO ID</div>
                <div className={reasonWrapper}>Reason</div>
                <div className={transactionWrapper}>Transaction Hash</div>
                <div className={actionsWrapper}>Actions</div>
            </div>
            <div>
                {withdrawItems?.length ? (
                    withdrawItems.map((withdraw: IWithdraw) => (
                        <TableRow
                            key={withdraw._id}
                            withdraw={withdraw}
                            selectWithdraw={selectWithdraw}
                            onApprove={confirmApporove}
                            onReject={confirmReject}
                        />
                    ))
                ) : (
                    <div></div>
                )}
            </div>

        </Wrapper>
    );
};

export default WithdrawTable;