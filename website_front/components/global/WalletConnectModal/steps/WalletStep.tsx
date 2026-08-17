import React, { FC } from 'react'
import { Center, Column, Title, Subtitle, PrimaryButton } from '../styles'
import { useTranslation } from 'i18n'

interface WalletStepProps {
    onConnect: () => void
    isLoading?: boolean
}

const WalletStep: FC<WalletStepProps> = ({ onConnect, isLoading = false }) => {
    const { t } = useTranslation()

    return (
        <Column>
            <Center>
                <Title>{t('auth.wallet.title')}</Title>
                <Subtitle>
                    {isLoading ? t('auth.wallet.confirming') : t('auth.wallet.subtitle')}
                </Subtitle>
            </Center>

            <PrimaryButton 
                variant="main" 
                onClick={onConnect}
                disabled={isLoading}
            >
                {isLoading ? t('auth.wallet.authenticating') : t('auth.wallet.connectWallet')}
            </PrimaryButton>

            {!isLoading && (
                <Subtitle style={{ fontSize: 12, textAlign: 'center' }}>
                    {t('auth.wallet.supportedWallets')}
                </Subtitle>
            )}
        </Column>
    )
}

export default WalletStep
