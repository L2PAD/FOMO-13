import React, { useState } from 'react';
import { IUser } from '../../types/global_types';
import Modal from '../../common/modal';
import ModalChatBody from './ModalChatBody';

interface IProps {
    initialUserId?: string;
    initialChatId?: string;
    isVisible: boolean;
    setIsVisible: (value: boolean) => void;
    userData: IUser;
    token: string;
}

const ChatModal = ({ initialUserId, initialChatId, isVisible, setIsVisible, userData, token }: IProps) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    return (
        isVisible
            ?
            <Modal
                onClose={() => {
                    setIsVisible(false);
                    setIsFullscreen(false);
                }}
                title=""
                className={`chat-modal ${isFullscreen ? 'fullscreen' : ''}`}
                isTitle={false}
            >
                <ModalChatBody
                    userId={initialUserId}
                    initialChatId={initialChatId}
                    isFullscreen={isFullscreen}
                    setIsFullscreen={() => setIsFullscreen((prev) => !prev)}
                    onClose={() => {
                        setIsVisible(false);
                        setIsFullscreen(false);
                    }}
                    userData={userData}
                    token={token}
                />
            </Modal>
            :
            <></>
    );
};

export default ChatModal;
