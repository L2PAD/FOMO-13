import React, { FC } from 'react';
import { IWithdraw } from '../../../../types/global_types';
import Checkbox from '../../../../common/checkbox';
import { createUseStyles } from 'react-jss';

interface IProps {
    withdraw: IWithdraw;
    selectWithdraw: (id: string) => void;
    onApprove?: (id: string) => Promise<void>;
    onReject?: (id: string) => Promise<void>;
}

const useStyles = createUseStyles({
    rowWrapper: {
        display: 'flex',
        alignItems: 'center',
        padding: '15px 23px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E8E9EB',
        cursor: 'pointer',
        transition: 'background 0.2s',

        '&:hover': {
            background: '#F5F5F7',
        },
    },
    checkboxWrapper: {
        width: 40,
    },
    userWrapper: {
        width: 180,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    userName: {
        fontWeight: "var(--font-weight-medium)",
        fontSize: '14px',
        color: '#2D3748',
    },
    userEmail: {
        fontSize: '12px',
        color: '#718096',
    },
    amountWrapper: {
        width: 100,
        fontWeight: "var(--font-weight-medium)",
        fontSize: '14px',
        color: '#2D3748',
    },
    currencyWrapper: {
        width: 80,
        fontSize: '14px',
        color: '#4A5568',
    },
    networkWrapper: {
        width: 80,
        fontSize: '14px',
        color: '#4A5568',
    },
    statusWrapper: {
        width: 100,
    },
    statusBadge: {
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: "var(--font-weight-medium)",
        display: 'inline-block',
    },
    dateWrapper: {
        width: 180,
        fontSize: '14px',
        color: '#4A5568',
    },
    reasonWrapper: {
        width: 200,
        fontSize: '14px',
        color: '#4A5568',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    fomoIdWrapper: {
        width: 100,
        fontSize: '14px',
        color: '#4A5568',
    },
    transactionWrapper: {
        width: 200,
        fontSize: '14px',
        color: '#4299E1',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        cursor: 'pointer',

        '&:hover': {
            textDecoration: 'underline',
        },
    },
    actionsWrapper: {
        width: 160,
        display: 'flex',
        gap: '8px',
    },
    actionButton: {
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: "var(--font-weight-medium)",
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        minWidth: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',

        '&:disabled': {
            opacity: 0.5,
            cursor: 'not-allowed',
        },

        '&:hover:not(:disabled)': {
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },

        '&:active:not(:disabled)': {
            transform: 'translateY(0)',
        },
    },
    approveButton: {
        backgroundColor: '#48BB78',
        color: 'white',

        '&:hover:not(:disabled)': {
            backgroundColor: '#38A169',
        },
    },
    rejectButton: {
        backgroundColor: '#F56565',
        color: 'white',

        '&:hover:not(:disabled)': {
            backgroundColor: '#E53E3E',
        },
    },
    pendingButton: {
        backgroundColor: '#EDF2F7',
        color: '#4A5568',
        cursor: 'default',

        '&:hover': {
            backgroundColor: '#EDF2F7',
            transform: 'none',
            boxShadow: 'none',
        },
    },
    actionIcon: {
        fontSize: '14px',
    },
});

const TableRow: FC<IProps> = ({
    withdraw,
    selectWithdraw,
    onApprove,
    onReject
}) => {
    const classes = useStyles();

    const getStatusInfo = (status: string) => {
        const statusMap: any = {
            '0': { text: 'Pending', color: '#F6AD55', bg: '#FEFCBF' },
            '1': { text: 'Completed', color: '#48BB78', bg: '#C6F6D5' },
            '4': { text: 'Deleted', color: '#F56565', bg: '#FED7D7' },
            '3': { text: 'Cancelled', color: '#F56565', bg: '#FED7D7' },
            '2': { text: 'Rejected', color: '#F56565', bg: '#FED7D7' },
            '5': { text: 'Approved', color: '#48BB78', bg: '#C6F6D5' },
        };
        return statusMap[status] || { text: 'Unknown', color: '#A0AEC0', bg: '#EDF2F7' };
    };

    const statusInfo = getStatusInfo(String(withdraw.status));
    const formattedDate = new Date(withdraw.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });


    const handleTransactionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (withdraw.transactionHash && withdraw.transactionHash !== 'temp_') {
            window.open(`https://etherscan.io/tx/${withdraw.transactionHash}`, '_blank');
        }
    };

    const handleApproveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onApprove && isActionable) {
            onApprove(withdraw._id);
        }
    };

    const handleRejectClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onReject && isActionable) {
            onReject(withdraw._id);
        }
    };

    const isActionable = String(withdraw.status) === '0';

    const getActionText = () => {
        switch (String(withdraw.status)) {
            case '0': return 'Pending';
            case '1': return '';
            case '2': return '';
            case '3': return '';
            case '4': return '';
            case '5': return '';
            default: return 'Unknown';
        }
    };

    return (
        <div className={classes.rowWrapper}>
            {/* <div className={classes.checkboxWrapper} onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    onChange={() => selectWithdraw(withdraw._id)}
                    active={!!withdraw.selected}
                />
            </div> */}

            <div className={classes.userWrapper}>
                <div className={classes.userName}>
                    {withdraw.userName || withdraw.discordData?.username || 'Unknown'}
                </div>
                <div className={classes.userEmail}>
                    {withdraw.userEmail || 'No email'}
                </div>
            </div>

            <div className={classes.amountWrapper}>
                {withdraw.amount}
            </div>

            <div className={classes.currencyWrapper}>
                {withdraw.currency}
            </div>

            <div className={classes.networkWrapper}>
                {withdraw.network?.toUpperCase() || '—'}
            </div>

            <div className={classes.statusWrapper}>
                <span
                    className={classes.statusBadge}
                    style={{
                        color: statusInfo.color,
                        backgroundColor: statusInfo.bg,
                    }}
                >
                    {statusInfo.text}
                </span>
            </div>

            <div className={classes.dateWrapper}>
                {formattedDate}
            </div>

            <div className={classes.fomoIdWrapper}>
                {withdraw.fomoId || '—'}
            </div>

            <div className={classes.reasonWrapper}>
                {withdraw.reason || '—'}
            </div>

            <div
                className={classes.transactionWrapper}
                onClick={handleTransactionClick}
                title={withdraw.transactionHash}
            >
                {withdraw.transactionHash && withdraw.transactionHash !== 'temp_'
                    ? `${withdraw.transactionHash.substring(0, 10)}...`
                    : 'Pending'}
            </div>

            <div className={classes.actionsWrapper} onClick={(e) => e.stopPropagation()}>
                {isActionable ? (
                    <>
                        <button
                            className={`${classes.actionButton} ${classes.approveButton}`}
                            onClick={handleApproveClick}
                            title="Approve withdrawal"
                        >
                            Approve
                        </button>
                        <button
                            className={`${classes.actionButton} ${classes.rejectButton}`}
                            onClick={handleRejectClick}
                            title="Reject withdrawal"
                        >
                            Reject
                        </button>
                    </>
                ) : (
                    <button
                        className={`${classes.actionButton} ${classes.pendingButton}`}
                        disabled
                    >
                        {getActionText()}
                    </button>
                )}
            </div>
        </div>
    );
};

export default TableRow;