import React, { FC } from 'react'
import { Center, Column, Title, Subtitle, PrimaryButton, MutedButton, InviteInput, ErrorText, ConfirmWrapper } from '../styles'
import Checkbox from '../../common/Checkbox'
import { useTranslation } from 'i18n'


const CompleteStep: FC<{
    email: string
    setEmail: (v: string) => void
    emailSent: boolean
    emailVerified: boolean
    emailCode: string
    setEmailCode: (v: string) => void
    accepted: boolean
    setAccepted: (v: boolean) => void
    onSendEmail: () => void
    onVerifyCode: () => void
    onComplete: () => void
    onSkip: () => void
    loading: boolean
    error: string
}> = ({
    email,
    setEmail,
    emailSent,
    emailVerified,
    emailCode,
    setEmailCode,
    accepted,
    setAccepted,
    onSendEmail,
    onVerifyCode,
    onComplete,
    onSkip,
    loading,
    error,
}) => {
    const { t } = useTranslation()

    return (
        <Column gap={16}>
            <Center>
                <Title>{t('auth.email.title')}</Title>
                <Subtitle>{t('auth.email.subtitle')}</Subtitle>
            </Center>

            {/* EMAIL */}
            <Column gap={8}>
                <label>{t('auth.email.email')}</label>
                <InviteInput
                    type="email"
                    value={email}
                    disabled={emailSent}
                    placeholder="you@email.com"
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ textTransform: 'none', letterSpacing: 'normal' }}
                />
            </Column>

            {/* CODE */}
            {emailSent && !emailVerified && (
                <Column gap={8}>
                    <label>{t('auth.email.verificationCode')}</label>
                    <InviteInput
                        value={emailCode}
                        onChange={(e) => setEmailCode(e.target.value)}
                        placeholder="12345"
                        maxLength={5}
                    />
                </Column>
            )}

            {error && <ErrorText>{error}</ErrorText>}

            <ConfirmWrapper>
                <Checkbox
                    checked={accepted}
                    onChange={() => setAccepted(!accepted)}
                />
                <p>
                    {t('auth.terms.agreePrefix')}{' '}
                    <a href="https://www.fomo.cx/legal?type=terms" target="_blank">
                        {t('auth.terms.terms')}
                    </a>{' '}
                    {t('auth.terms.and')}{' '}
                    <a href="https://www.fomo.cx/legal?type=policy" target="_blank">
                        {t('auth.terms.privacy')}
                    </a>
                </p>
            </ConfirmWrapper>

            {!emailSent && (
                <PrimaryButton
                    variant="main"
                    disabled={!email || loading || !accepted}
                    onClick={onSendEmail}
                >
                    {loading ? t('auth.email.sending') : t('auth.email.sendCode')}
                </PrimaryButton>
            )}

            {emailSent && !emailVerified && (
                <PrimaryButton
                    variant="main"
                    disabled={emailCode.length !== 5 || loading || !accepted}
                    onClick={onVerifyCode}
                >
                    {loading ? t('auth.email.verifying') : t('auth.email.verifyCode')}
                </PrimaryButton>
            )}

            {emailVerified && (
                <PrimaryButton
                    variant="main"
                    disabled={!accepted || loading}
                    onClick={onComplete}
                >
                    {loading ? t('auth.email.completing') : t('auth.email.completeRegistration')}
                </PrimaryButton>
            )}

            <MutedButton type="button" disabled={loading} onClick={onSkip}>
                {t('auth.email.skip')}
            </MutedButton>
        </Column>
    )
}

export default CompleteStep
