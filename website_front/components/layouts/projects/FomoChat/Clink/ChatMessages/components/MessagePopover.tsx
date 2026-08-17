import React, { FC } from "react";
import changeDateType from "../../../../../../../helpers/changeDateType";

interface MessagePopoverProps {
    messageDate: Date | string | undefined;
    isLastMessage?: boolean;
    isFirstMessage?: boolean;
    isReported?: boolean;
    onForward: () => void;
    onCopy: () => void;
    onReport: () => void;
    innerRef?: React.RefObject<HTMLDivElement>;
}

const MessagePopover: FC<MessagePopoverProps> = ({
    messageDate,
    isLastMessage = false,
    isFirstMessage = false,
    isReported = false,
    onForward,
    onCopy,
    onReport,
    innerRef
}) => {
    const popoverClassName = isLastMessage && !isFirstMessage
        ? 'message-popover popover-position-top'
        : isFirstMessage
            ? 'message-popover popover-position-bottom'
            : 'message-popover';

    return (
        <div
            className={popoverClassName}
            ref={innerRef}
        >
            <span>{messageDate && changeDateType(messageDate)}</span>
            <hr />
            <button className="popover-item" onClick={onCopy}>
                <span>Copy</span>
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M15.834 10.834L15.834 5.83401C15.834 4.45329 14.7147 3.334 13.334 3.33401L8.52148 3.33407M11.5007 16.6673L6.62565 16.6673C5.72819 16.6673 5.00065 15.9211 5.00065 15.0007L5.00065 7.77849C5.00065 6.85802 5.72819 6.11183 6.62565 6.11183L11.5007 6.11183C12.3981 6.11183 13.1257 6.85802 13.1257 7.77848L13.1257 15.0007C13.1257 15.9211 12.3981 16.6673 11.5007 16.6673Z"
                        stroke="#070B35"
                        stroke-linecap="round"
                    />
                </svg>
            </button>
            <hr />
            <button
                className={`popover-item delete ${isReported ? 'disabled' : ''}`}
                onClick={isReported ? undefined : onReport}
                disabled={isReported}
                style={isReported ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
                <span>{isReported ? 'Reported' : 'Report'}</span>
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M3.33398 16.6673H6.97035M5.15217 10.2905V3.33398H16.6673L14.8491 6.81225L16.6673 10.2905H5.15217ZM5.15217 10.2905V16.0876"
                        stroke="#FF5857"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            </button>
        </div>
    );
};

export default MessagePopover;
