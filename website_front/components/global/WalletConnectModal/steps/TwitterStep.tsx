import React, { FC } from 'react'
import { Center, Column, Subtitle, PrimaryButton, MutedButton } from '../styles'
import { TwitterIcon } from '../../Icons'
import { useTranslation } from 'i18n'

const TwitterStep: FC<{
    isConnected: boolean
    username: string
    onConnect: () => void
    onSkip: () => void
    isLoading: boolean
}> = ({ isConnected, username, onConnect, onSkip, isLoading }) => {
    const { t } = useTranslation()

    return (
        <Column>
            <Center>
                <Subtitle>{t('auth.twitter.subtitle')}</Subtitle>
            </Center>

            {isConnected ? (
                <Column>
                    <strong>{t('auth.twitter.connected')}</strong>
                    <Subtitle>{username}</Subtitle>
                    <MutedButton onClick={onSkip}>{t('auth.twitter.continue')}</MutedButton>
                </Column>
            ) : (
                <Column>
                    <PrimaryButton
                        variant="main"
                        disabled={isLoading}
                        onClick={onConnect}
                    >
                        {isLoading ? t('auth.twitter.connecting') : t('auth.twitter.connect')}
                        <TwitterIcon fill='white' />
                    </PrimaryButton>
                    <MutedButton type="button" onClick={onSkip}>
                        {t('auth.twitter.skip')}
                    </MutedButton>
                </Column>
            )}
        </Column>
    )
}


export default TwitterStep
