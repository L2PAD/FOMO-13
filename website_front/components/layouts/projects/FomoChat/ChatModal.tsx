import React, { useState } from 'react'
import MainModal from '../../../global/common/MainModal'
import ModalChatBody from './ModalChatBody'

interface IProps {
    initialUserId?: string
    initialChatId?: string
    isVisible: boolean
    setIsVisible: (value: boolean) => void
}

const ChatModal = ({ initialUserId, initialChatId, isVisible, setIsVisible }: IProps) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    return (
        <MainModal
            className={`chat ${isFullscreen ? 'fullscreen-modal' : ''}`}
            variant={'filter'}
            title=''
            isTitle={false}
            isVisible={isVisible}
            onClose={() => {
                setIsVisible(false)
                setIsFullscreen(false);
            }}
            style={isFullscreen ? {
                width: '100vw',
                height: '100vh',
                margin: 0,
                padding: 0,
                borderRadius: 0
            } : undefined}
        >
            <ModalChatBody
                userId={initialUserId}
                initialChatId={initialChatId}
                isFullscreen={isFullscreen}
                setIsFullscreen={() => setIsFullscreen((prev) => !prev)}
                onClose={() => {
                    setIsVisible(false)
                    setIsFullscreen(false)
                }}
            />
        </MainModal>
    )
}

export default ChatModal
