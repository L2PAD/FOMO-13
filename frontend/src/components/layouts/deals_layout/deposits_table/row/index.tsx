import React, { FC, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { IDeposit } from '../../../../types/global_types';
import { CopyIcon } from '../../../../../assets';
import copy from 'clipboard-copy'
import { toast } from 'react-toastify';

interface IProps {
    deposit: IDeposit;
    isSelected: boolean;
    onSelect: () => void;
    isProcessing?: boolean;
}

const useStyles = createUseStyles({
    rowWrapper: {
        display: 'flex',
        alignItems: 'center',
        padding: '16px 24px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        transition: 'background-color 0.2s',
        cursor: 'pointer',

        '&:hover': {
            backgroundColor: '#F7FAFC',
        },

        '&:last-child': {
            borderBottom: 'none',
        },
    },
    checkboxWrapper: {
        width: 40,
        paddingRight: '8px',
    },
    userWrapper: {
        width: 200,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    userName: {
        fontWeight: "var(--font-weight-medium)",
        fontSize: '14px',
        color: '#2D3748',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    userEmail: {
        fontSize: '12px',
        color: '#718096',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    userId: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '14px',
        fontFamily: 'monospace',
    },
    amountWrapper: {
        width: 120,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    amountValue: {
        fontWeight: "var(--font-weight-semibold)",
        fontSize: '14px',
        color: '#2D3748',
    },
    amountNet: {
        fontSize: '11px',
        color: '#718096',
    },
    currencyWrapper: {
        width: 80,
        flexShrink: 0,
        fontSize: '14px',
        color: '#4A5568',
        fontWeight: "var(--font-weight-medium)",
    },
    networkWrapper: {
        width: 100,
        flexShrink: 0,
    },
    networkBadge: {
        display: 'inline-block',
        padding: '4px 8px',
        backgroundColor: '#EDF2F7',
        color: '#4A5568',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: "var(--font-weight-medium)",
        textAlign: 'center',
    },
    statusWrapper: {
        width: 120,
        flexShrink: 0,
    },
    statusBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: "var(--font-weight-medium)",
        textTransform: 'capitalize',
    },
    dateWrapper: {
        width: 180,
        flexShrink: 0,
        fontSize: '13px',
        color: '#4A5568',
    },
    walletWrapper: {
        width: 200,
        flexShrink: 0,
    },
    addressContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: '4px',
        transition: 'background-color 0.2s',

        '&:hover': {
            backgroundColor: '#EDF2F7',
        },
    },
    addressText: {
        fontSize: '12px',
        color: '#4299E1',
        fontFamily: 'monospace',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    copyIcon: {
        fontSize: '11px',
        color: '#A0AEC0',
        flexShrink: 0,
    },
    copiedIcon: {
        fontSize: '11px',
        color: '#48BB78',
        flexShrink: 0,
    },
    transactionWrapper: {
        width: 220,
        flexShrink: 0,
    },
    transactionContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    transactionLink: {
        fontSize: '12px',
        color: '#4299E1',
        fontFamily: 'monospace',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textDecoration: 'none',
        cursor: 'pointer',

        '&:hover': {
            textDecoration: 'underline',
        },
    },
    externalIcon: {
        fontSize: '11px',
        color: '#A0AEC0',
        flexShrink: 0,
    },
    feesWrapper: {
        width: 150,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    feeItem: {
        fontSize: '11px',
        color: '#718096',
        display: 'flex',
        justifyContent: 'space-between',
    },
    feeLabel: {
        fontWeight: "var(--font-weight-medium)",
    },
    feeValue: {
        fontFamily: 'monospace',
    },
    actionsWrapper: {
        width: 150,
        flexShrink: 0,
        display: 'flex',
        gap: '8px',
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
    viewButton: {
        backgroundColor: '#EDF2F7',
        color: '#4A5568',
        cursor: 'default',

        '&:hover': {
            backgroundColor: '#EDF2F7',
            transform: 'none',
            boxShadow: 'none',
        },
    },
    confirmations: {
        fontSize: '11px',
        color: '#718096',
        marginTop: '2px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    confirmationsDot: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
    },
});

const TableRow: FC<IProps> = ({
    deposit,
    isProcessing = false,
}) => {
    const classes = useStyles();
    const [localProcessing, setLocalProcessing] = useState(false);

    const getStatusInfo = (status: string) => {
        const statusMap: any = {
            'pending': {
                text: 'Pending',
                color: '#D69E2E',
                bg: '#FEFCBF',
                dotColor: '#D69E2E'
            },
            'confirmed': {
                text: 'Confirmed',
                color: '#38A169',
                bg: '#C6F6D5',
                dotColor: '#38A169'
            },
            'failed': {
                text: 'Failed',
                color: '#E53E3E',
                bg: '#FED7D7',
                dotColor: '#E53E3E'
            },
        };
        return statusMap[status] || {
            text: 'Unknown',
            color: '#A0AEC0',
            bg: '#EDF2F7',
            dotColor: '#A0AEC0'
        };
    };

    const getExplorerUrl = () => {
        const network = deposit.network?.toLowerCase();
        const txHash = deposit.transactionHash;

        if (!txHash || txHash === 'temp_') return null;

        const explorers: Record<string, string> = {
            'zksync': `https://explorer.zksync.io/tx/${txHash}`,
            'ethereum': `https://etherscan.io/tx/${txHash}`,
            'arbitrum': `https://arbiscan.io/tx/${txHash}`,
            'polygon': `https://polygonscan.com/tx/${txHash}`,
            'bsc': `https://bscscan.com/tx/${txHash}`,
        };

        return explorers[network] || explorers.ethereum;
    };

    const handleApproveClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (deposit.status !== 'pending' || localProcessing) return;

        setLocalProcessing(true);

    };

    const handleRejectClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (deposit.status !== 'pending' || localProcessing) return;

        setLocalProcessing(true);
    };

    const handleRowClick = () => {
        copy(deposit.walletAddress)
        toast.success('Copied!')
    };

    const statusInfo = getStatusInfo(deposit.status);
    const formattedDate = new Date(deposit.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const explorerUrl = getExplorerUrl();
    const isActionable = deposit.status === 'pending';
    const processing = localProcessing || isProcessing;

    return (
        <div className={classes.rowWrapper}>

            <div
                onClick={handleRowClick}
                className={classes.userWrapper}>
                <div
                    tabIndex={0}
                    className={classes.userId}>
                    {deposit.walletAddress?.substring(0, 8)}...
                    <CopyIcon />
                </div>
            </div>

            <div className={classes.amountWrapper}>
                <div className={classes.amountValue}>
                    {deposit.amount.toFixed(4)} {deposit.currency}
                </div>
                <div className={classes.amountNet}>
                    Net: {deposit.netAmount?.toFixed(4)} {deposit.currency}
                </div>
            </div>

            <div className={classes.currencyWrapper}>
                {deposit.currency}
            </div>

            <div className={classes.networkWrapper}>
                <span className={classes.networkBadge}>
                    {deposit.network}
                </span>
            </div>

            <div className={classes.statusWrapper}>
                <span
                    className={classes.statusBadge}
                    style={{
                        color: statusInfo.color,
                        backgroundColor: statusInfo.bg,
                    }}
                >
                    <span
                        className={classes.confirmationsDot}
                        style={{ backgroundColor: statusInfo.dotColor }}
                    />
                    {statusInfo.text}
                </span>
                {deposit.confirmations > 0 && (
                    <div className={classes.confirmations}>
                        {deposit.confirmations} confirmation{deposit.confirmations !== 1 ? 's' : ''}
                    </div>
                )}
            </div>

            <div className={classes.dateWrapper}>
                {formattedDate}
            </div>


            <div className={classes.transactionWrapper}>
                {explorerUrl ? (
                    <div className={classes.transactionContainer}>
                        <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={classes.transactionLink}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {deposit.transactionHash?.substring(0, 12)}...
                        </a>
                        {/* <CopyToClipboard text={deposit.transactionHash} onCopy={handleCopyTxHash}>
                            <div onClick={(e) => e.stopPropagation()} style={{ cursor: 'pointer' }}>
                                {copiedTxHash ? (
                                    <FaCheck className={classes.copiedIcon} />
                                ) : (
                                    <FaCopy className={classes.copyIcon} />
                                )}
                            </div>
                        </CopyToClipboard> */}
                        <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* <FaExternalLinkAlt className={classes.externalIcon} /> */}
                        </a>
                    </div>
                ) : (
                    <div className={classes.addressText} style={{ color: '#718096' }}>
                        {deposit.transactionHash === 'temp_' ? 'Generating...' : 'No hash'}
                    </div>
                )}
            </div>

          
        </div>
    );
};

export default TableRow;