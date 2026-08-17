import React, { FC, useState, useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import { toast } from 'react-toastify';
import { IDeposit } from '../../../types/global_types';
import TableRow from './row';
import Loader from '../../../common/loader';

interface IProps {
    depositItems: IDeposit[];
    isLoading?: boolean;
}

const useStyles = createUseStyles({
    wrapper: {
        width: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
    },
    headerWrapper: {
        display: 'flex',
        alignItems: 'center',
        padding: '6px 20px',
        color: '#738094',
        fontWeight: "var(--font-weight-regular)",
        fontSize: '12px',
        lineHeight: '14px',
        '& div': {
            color: '#738094',
        }
    },
    checkboxWrapper: {
        width: 40,
        paddingRight: '8px',
    },
    userWrapper: {
        width: 200,
        flexShrink: 0,
    },
    amountWrapper: {
        width: 120,
        flexShrink: 0,
    },
    currencyWrapper: {
        width: 80,
        flexShrink: 0,
    },
    networkWrapper: {
        width: 100,
        flexShrink: 0,
    },
    statusWrapper: {
        width: 120,
        flexShrink: 0,
    },
    dateWrapper: {
        width: 180,
        flexShrink: 0,
    },
    walletWrapper: {
        width: 200,
        flexShrink: 0,
    },
    transactionWrapper: {
        width: 220,
        flexShrink: 0,
    },
    feesWrapper: {
        width: 150,
        flexShrink: 0,
    },
    actionsWrapper: {
        width: 150,
        flexShrink: 0,
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        color: '#718096',
        fontSize: '14px',
        textAlign: 'center',
    },
    emptyIcon: {
        fontSize: '48px',
        marginBottom: '16px',
        opacity: 0.5,
    },
    loadingWrapper: {
        display: 'flex',
        justifyContent: 'center',
        padding: '40px',
    },
});

const DepositsTable: FC<IProps> = ({ depositItems, isLoading = false }) => {
    const [isSelectAll, setIsSelectAll] = useState<boolean>(false);
    const [selectedDeposits, setSelectedDeposits] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const classes = useStyles();

    const selectAll = () => {
        if (isSelectAll) {
            setSelectedDeposits([]);
        } else {
            setSelectedDeposits(depositItems.map(deposit => deposit._id));
        }
        setIsSelectAll(!isSelectAll);
    };

    const selectDeposit = (id: string) => {
        setSelectedDeposits(prev =>
            prev.includes(id)
                ? prev.filter(depositId => depositId !== id)
                : [...prev, id]
        );
    };

    const handleBulkApprove = async (): Promise<void> => {
        if (selectedDeposits.length === 0 || isProcessing) return;

        setIsProcessing(true);
        try {
            toast.info('Bulk approve functionality to be implemented');
        } catch (error) {
            toast.error('Failed to approve deposits');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkReject = async (): Promise<void> => {
        if (selectedDeposits.length === 0 || isProcessing) return;

        setIsProcessing(true);
        try {
            toast.info('Bulk reject functionality to be implemented');
        } catch (error) {
            toast.error('Failed to reject deposits');
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (depositItems.length > 0 && selectedDeposits.length === depositItems.length) {
            setIsSelectAll(true);
        } else {
            setIsSelectAll(false);
        }
    }, [depositItems, selectedDeposits]);

    if (isLoading) {
        return (
            <div className={classes.wrapper}>
                <div className={classes.loadingWrapper}>
                    <Loader />
                </div>
            </div>
        );
    }

    return (
        <div className={classes.wrapper}>
            {selectedDeposits.length > 0 && (
                <div style={{
                    padding: '12px 24px',
                    backgroundColor: '#EBF8FF',
                    borderBottom: '1px solid #BEE3F8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                }}>
                    <span style={{ fontSize: '14px', color: '#2C5282' }}>
                        {selectedDeposits.length} deposit{selectedDeposits.length !== 1 ? 's' : ''} selected
                    </span>
                    <button
                        onClick={handleBulkApprove}
                        disabled={isProcessing}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: '#48BB78',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: "var(--font-weight-medium)",
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            opacity: isProcessing ? 0.6 : 1,
                        }}
                    >
                        Approve Selected
                    </button>
                    <button
                        onClick={handleBulkReject}
                        disabled={isProcessing}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: '#F56565',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: "var(--font-weight-medium)",
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            opacity: isProcessing ? 0.6 : 1,
                        }}
                    >
                        Reject Selected
                    </button>
                    <button
                        onClick={() => setSelectedDeposits([])}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: 'transparent',
                            color: '#4A5568',
                            border: '1px solid #CBD5E0',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                        }}
                    >
                        Clear Selection
                    </button>
                </div>
            )}

            <div className={classes.headerWrapper}>
                <div className={classes.userWrapper}>User Wallet</div>
                <div className={classes.amountWrapper}>Amount</div>
                <div className={classes.currencyWrapper}>Currency</div>
                <div className={classes.networkWrapper}>Network</div>
                <div className={classes.statusWrapper}>Status</div>
                <div className={classes.dateWrapper}>Created Date</div>
                <div className={classes.transactionWrapper}>Transaction Hash</div>
            </div>

            {depositItems?.length ? (
                depositItems.map((deposit: IDeposit) => (
                    <TableRow
                        key={deposit._id}
                        deposit={deposit}
                        isSelected={selectedDeposits.includes(deposit._id)}
                        onSelect={() => selectDeposit(deposit._id)}
                        isProcessing={isProcessing}
                    />
                ))
            ) : (
                <Loader />
            )}
        </div>
    );
};

export default DepositsTable;