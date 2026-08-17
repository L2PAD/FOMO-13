import React, { FC } from 'react'
import { Center, Column, Title, Subtitle, PrimaryButton, MutedButton, InviteInput, ErrorText } from '../styles'
import { useTranslation } from 'i18n'

const InviteStep: FC<{
    inviteCode: string
    setInviteCode: React.Dispatch<React.SetStateAction<string>>
    onVerify: () => void
    onSkip: () => void
    isLoading: boolean
    error: string
}> = ({
    inviteCode,
    setInviteCode,
    onVerify,
    onSkip,
    isLoading,
    error,
}) => {
    const { t } = useTranslation()

    return (
        <Column>
            <Center>
                <Title>{t('auth.invite.title')}</Title>
                <Subtitle>{t('auth.invite.subtitle')}</Subtitle>
            </Center>

            <InviteInput
                value={inviteCode}
                onChange={(e) =>
                    setInviteCode(e.target.value.slice(0, 5))
                }
                placeholder="DvE52"
                maxLength={5}
            />

            {error && <ErrorText>{error}</ErrorText>}

            <PrimaryButton
                variant="main"
                disabled={isLoading || inviteCode.length !== 5}
                onClick={onVerify}
            >
                {isLoading ? t('auth.invite.verifying') : t('auth.invite.verifyCode')}
            </PrimaryButton>

            <MutedButton onClick={onSkip}>{t('auth.invite.skip')}</MutedButton>
        </Column>
    )
}


export default InviteStep
