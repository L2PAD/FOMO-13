'use client'

import React, { FC, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAccount, useConfig, useSignMessage, useSwitchChain } from 'wagmi'
import { useDisconnect } from '@reown/appkit/react'
import { appKit } from '../../../config/web3'
import { ZKSYNC_CHAIN_ID } from '../../../config/zksync'
import { API } from '../../../config/api'
import MainModal from '../common/MainModal'
import FomoLogo from '../Icons/FomoLogo'
import checkCode from '../../../http/auth/checkCode'
import { setTokenCookie } from '../../../helpers/cookieToken'
import getAuthToken from '../../../http/getAuthToken'
import { toast } from 'react-toastify'
import { AuthContext, LoadingContext } from '../Layout'
import { LogoWrapper, ModalCard } from './styles'
import StepIndicator from './steps/StepIndicator'
import WalletStep from './steps/WalletStep'
import TwitterStep from './steps/TwitterStep'
import InviteStep from './steps/InviteStep'
import CompleteStep from './steps/CompleteStep'
import { useTranslation } from 'i18n'

type Mode = 'registration' | 'connected'
type StepNumber = 1 | 2 | 3 | 4

interface Step {
    number: StepNumber
    completed: boolean
}

interface Props {
    isOpen: boolean
    onClose: () => void
    onAuthenticated?: () => void
    inviteCodeFromUrl?: string
    isTwitterAuth?: boolean
}

const WalletConnectModal: FC<Props> = ({
    isOpen,
    onClose,
    onAuthenticated,
    inviteCodeFromUrl,
    isTwitterAuth,
}) => {
    const { t } = useTranslation()
    const { refetchAuthData } = useContext(AuthContext)
    const { loadingStateHandler } = useContext(LoadingContext)
    const { disconnect } = useDisconnect()
    const wagmiConfig = useConfig()
    const { signMessageAsync } = useSignMessage()
    const { switchChainAsync } = useSwitchChain()
    const [email, setEmail] = useState('')
    const [emailSent, setEmailSent] = useState(false)
    const [emailVerified, setEmailVerified] = useState(false)
    const [emailCode, setEmailCode] = useState('')
    const [emailError, setEmailError] = useState('')
    const [mode, setMode] = useState<Mode>('registration')
    // --- DEV/TEST BYPASS (safe to remove) -------------------------------------
    // Allows reaching a specific registration step without a real wallet, for
    // automated/manual QA. Trigger with `?auth=true&fomoDevStep=3` in the URL.
    // Normal users (no param) are unaffected — flow always starts at step 1.
    const getInitialStep = (): StepNumber => {
        if (typeof window !== 'undefined') {
            const raw = new URLSearchParams(window.location.search).get('fomoDevStep')
            const n = Number(raw)
            if (n >= 1 && n <= 4) return n as StepNumber
        }
        return 1
    }
    const [step, setStep] = useState<StepNumber>(getInitialStep())
    // --------------------------------------------------------------------------
    const [inviteCode, setInviteCode] = useState<string>(
        inviteCodeFromUrl || ''
    )
    const [accepted, setAccepted] = useState<boolean>(false)
    const [error, setError] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const [twitterConnected, setTwitterConnected] =
        useState<boolean>(false)
    const twitterUsername = ''
    const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false)
    const { address, connector, isConnected } = useAccount()
    const connectorId = connector?.id
    const connectorUid = connector?.uid
    const authAttemptKeyRef = useRef<string | null>(null)
    const authInProgressRef = useRef(false)

    const closeAfterAuthentication = useCallback(() => {
        if (onAuthenticated) {
            onAuthenticated()
        } else {
            onClose()
        }
    }, [onAuthenticated, onClose])

    const steps: Step[] = [
        { number: 1, completed: isConnected && !isAuthenticating },
        { number: 2, completed: step > 2 },
        { number: 3, completed: twitterConnected },
        { number: 4, completed: mode === 'connected' },
    ]

    const connectWallet = async () => {
        try {
            setLoading(true)
            await appKit.open()
        } finally {
            setLoading(false)
        }
    }

    const syncWagmiConnectionChain = useCallback(() => {
        const currentConnectionId = wagmiConfig.state.current
        if (!currentConnectionId) return

        const connection = wagmiConfig.state.connections.get(currentConnectionId)
        if (!connection || connection.chainId === ZKSYNC_CHAIN_ID) return

        wagmiConfig.setState((state) => ({
            ...state,
            chainId: ZKSYNC_CHAIN_ID,
            connections: new Map(state.connections).set(currentConnectionId, {
                ...connection,
                chainId: ZKSYNC_CHAIN_ID,
            }),
        }))
    }, [wagmiConfig])

    const ensureZkSyncChain = useCallback(async () => {
        const currentConnectionId = wagmiConfig.state.current
        const connection = currentConnectionId
            ? wagmiConfig.state.connections.get(currentConnectionId)
            : undefined
        const wagmiChainId = connection?.chainId
        const connectorChainId = connector?.getChainId
            ? await connector.getChainId().catch(() => undefined)
            : undefined

        if (connectorChainId === ZKSYNC_CHAIN_ID && wagmiChainId !== ZKSYNC_CHAIN_ID) {
            syncWagmiConnectionChain()
            return
        }

        if (connectorChainId !== ZKSYNC_CHAIN_ID || wagmiChainId !== ZKSYNC_CHAIN_ID) {
            await switchChainAsync({ chainId: ZKSYNC_CHAIN_ID })
        }

        const nextConnectorChainId = connector?.getChainId
            ? await connector.getChainId().catch(() => undefined)
            : undefined

        if (nextConnectorChainId && nextConnectorChainId !== ZKSYNC_CHAIN_ID) {
            throw new Error('Please switch your wallet to ZKsync Era.')
        }

        syncWagmiConnectionChain()
    }, [connector, switchChainAsync, syncWagmiConnectionChain, wagmiConfig])

    const verifyInvite = async (): Promise<void> => {
        setLoading(true)
        setError('')

        const isValid: boolean = await checkCode(inviteCode)

        setLoading(false)

        if (!isValid) {
            setError(t('auth.invite.invalidCode'))
            setTimeout(() => setError(''), 3000)
            return
        }

        localStorage.setItem('FOMO-INVITE-CODE', inviteCode)
        setStep(3)
    }

    const connectTwitter = async (): Promise<void> => {
        try {
            setLoading(true)

            const token = getAuthToken()

            if (!token) {
                toast.error('Please connect your wallet before linking Twitter.')
                setLoading(false)
                return
            }

            const res = await fetch(`${API}/twitter/link/start`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            const data = await res.json()

            if (!res.ok || !data?.redirectUrl) {
                throw new Error('Twitter OAuth start failed')
            }

            window.location.assign(data.redirectUrl)
        } catch (error) {
            toast.error('Unable to start Twitter authorization. Please try again.')
            setLoading(false)
        }
    }

    const complete = async (): Promise<void> => {
        setMode('connected')
    }

    // DEV/PREVIEW: skip email confirmation (no SMTP configured) and finish
    // registration as an authorized user. Backend activates the wallet account
    // (guarded by EMAIL_DEV_BYPASS) and returns fresh tokens.
    const skipEmail = async (): Promise<void> => {
        try {
            setLoading(true)
            setEmailError('')

            const token = getAuthToken()

            const res = await fetch(`${API}/auth/email/skip`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    inviteCode: localStorage.getItem('FOMO-INVITE-CODE') || undefined,
                }),
            })

            const data = await res.json().catch(() => null)

            if (res.ok) {
                const accessToken = data?.tokens?.accessToken || data?.accessToken
                if (accessToken) {
                    setTokenCookie(accessToken)
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('fomo-token', accessToken)
                        if (data?.user) {
                            localStorage.setItem('fomo-user', JSON.stringify(data.user))
                        }
                    }
                }
            }

            // Even if the endpoint is unavailable, the wallet token already grants
            // an authenticated session — close the modal so the user can browse.
            await refetchAuthData()
            closeAfterAuthentication()
            setStep(1)

            toast.success(<div>
                <h4>{t('auth.success.title')}</h4>
                <p>{t('auth.success.accountCreated')}</p>
            </div>)
        } catch (error) {
            try {
                await refetchAuthData()
            } catch { /* noop */ }
            closeAfterAuthentication()
        } finally {
            setLoading(false)
        }
    }

    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    const sendEmailCode = async () => {
        try {
            setLoading(true)
            setEmailError('')

            if (!email || !email.trim()) {
                setEmailError(t('auth.email.required'))
                setLoading(false)
                return
            }

            if (!isValidEmail(email)) {
                setEmailError(t('auth.email.invalidFormat'))
                setLoading(false)
                return
            }

            const token = getAuthToken()

            const res = await fetch(`${API}/auth/send-confirm?email=${email}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!res.ok) {
                setEmailError(t('auth.email.sendFailed'))
                setLoading(false)
                return
            }

            setEmailSent(true)
        } catch (error) {
            setEmailError(t('auth.email.sendFailed'))
        } finally {
            setLoading(false)
        }
    }

    const verifyEmailCode = async () => {
        try {
            setLoading(true)
            setEmailError('')
            const token = getAuthToken()

            const res = await fetch(`${API}/auth/email/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    code: emailCode,
                    inviteCode: localStorage.getItem('FOMO-INVITE-CODE') || undefined,
                }),
            })

            const data = await res.json().catch(() => null)

            if (!res.ok || !data?.valid) {
                setEmailError(t('auth.email.invalidCode'))
                return
            }

            const accessToken = data?.tokens?.accessToken || data?.accessToken

            if (accessToken) {
                setTokenCookie(accessToken)

                if (typeof window !== 'undefined') {
                    localStorage.setItem('fomo-token', accessToken)

                    if (data?.user) {
                        localStorage.setItem('fomo-user', JSON.stringify(data.user))
                    }
                }
            }

            setEmailVerified(true)
            await refetchAuthData()
            closeAfterAuthentication()
            setStep(1)

            toast.success(<div>
                <h4>{t('auth.success.title')}</h4>
                <p>{t('auth.success.accountCreated')}</p>
            </div>)
        } catch (error) {
            setEmailError(t('auth.email.verifyFailed'))
        } finally {
            setLoading(false)
        }
    }

    const handleStepBack = (): void => {
        if (step > 1) {
            setStep((prev) => (prev - 1) as StepNumber)
        }
    }

    useEffect(() => {
        if (!isConnected || !address) {
            authAttemptKeyRef.current = null
            authInProgressRef.current = false
            setIsAuthenticating(false)
            return
        }

        if (isTwitterAuth) {
            authInProgressRef.current = false
            setIsAuthenticating(false)
            setLoading(false)
            loadingStateHandler(false)
            return
        }

        const authAttemptKey = `${address.toLowerCase()}:${connectorUid || connectorId || 'unknown'}`

        if (
            authInProgressRef.current ||
            authAttemptKeyRef.current === authAttemptKey ||
            step !== 1
        ) {
            return
        }

        authAttemptKeyRef.current = authAttemptKey
        authInProgressRef.current = true

        const auth = async () => {
            try {
                setIsAuthenticating(true)
                setLoading(true)
                loadingStateHandler(true)

                const existingToken = getAuthToken()

                if (existingToken) {
                    try {
                        const authData = await refetchAuthData()
                        const existingUser = authData?.data

                        if (existingUser?.email && existingUser?.isActive && existingUser?.wallet) {
                            setIsAuthenticating(false)
                            setLoading(false)
                            loadingStateHandler(false)
                            closeAfterAuthentication()
                            return
                        }
                    } catch {
                        // Continue with wallet signature if the cached token cannot be verified.
                    }
                }

                await ensureZkSyncChain()

                const nonceRes = await fetch(
                    `${API}/auth/nonce?address=${address}`
                )
                const { nonce } = await nonceRes.json()

                const message = `Sign in to FOMO

Wallet: ${address}
Nonce: ${nonce}`

                const signature = await signMessageAsync({ message })

                const res = await fetch(`${API}/auth/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address, message, signature }),
                })

                const data = await res.json()

                if (data?.tokens?.accessToken) {
                    const { accessToken } = data.tokens

                    setTokenCookie(accessToken)

                    if (typeof window !== 'undefined') {
                        localStorage.setItem('fomo-token', accessToken)

                        if (data?.user) {
                            localStorage.setItem('fomo-user', JSON.stringify(data.user))
                        }
                    }
                }

                const isActive = data?.user?.isActive === true
                const hasEmail = !!data?.user?.email

                if (isActive && hasEmail) {
                    await refetchAuthData()
                    setIsAuthenticating(false)
                    setLoading(false)
                    loadingStateHandler(false)
                    closeAfterAuthentication()
                    return
                }

                if (data?.tokens?.accessToken) {
                    setIsAuthenticating(false)
                    setLoading(false)
                    loadingStateHandler(false)
                    setStep(2)
                    return
                }

                setIsAuthenticating(false)
                setLoading(false)
                loadingStateHandler(false)
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('Wallet auth failed', e)
                toast.error(t('auth.wallet.switchToZkSyncFailed', {
                    defaultValue: 'Please switch your wallet to ZKsync Era and try again.',
                }))
                disconnect()
                authAttemptKeyRef.current = null
                setIsAuthenticating(false)
                setLoading(false)
                loadingStateHandler(false)
            } finally {
                authInProgressRef.current = false
            }
        }

        auth()
    }, [
        address,
        closeAfterAuthentication,
        connectorId,
        connectorUid,
        disconnect,
        ensureZkSyncChain,
        isConnected,
        isTwitterAuth,
        loadingStateHandler,
        refetchAuthData,
        signMessageAsync,
        step,
        t,
    ])

    useEffect(() => {
        if (!isTwitterAuth) return

        const token = getAuthToken()
        if (!token && !isConnected) return

        setTwitterConnected(true)
        setStep(4)
        setIsAuthenticating(false)
        setLoading(false)

    }, [isTwitterAuth, isConnected])

    return (
        <MainModal
            isCloseIcon={false}
            isModalBack={handleStepBack}
            isVisible={isOpen} onClose={onClose} title="" isTitle={false} >
            <ModalCard>
                {mode === 'registration' && (
                    <>
                        <LogoWrapper>
                            <FomoLogo />
                        </LogoWrapper>

                        <StepIndicator steps={steps} currentStep={step} />

                        {step === 1 && (
                            <WalletStep
                                onConnect={connectWallet}
                                isLoading={isAuthenticating || loading || (isConnected && step === 1)}
                            />
                        )}

                        {step === 2 && (
                            <InviteStep
                                inviteCode={inviteCode}
                                setInviteCode={setInviteCode}
                                onVerify={verifyInvite}
                                onSkip={() => setStep(3)}
                                error={error}
                                isLoading={loading}
                            />
                        )}

                        {step === 3 && (
                            <TwitterStep
                                isConnected={twitterConnected}
                                username={twitterUsername}
                                onConnect={connectTwitter}
                                onSkip={() => setStep(4)}
                                isLoading={loading}
                            />
                        )}

                        {step === 4 && (
                            <CompleteStep
                                email={email}
                                setEmail={setEmail}
                                emailSent={emailSent}
                                emailVerified={emailVerified}
                                emailCode={emailCode}
                                setEmailCode={setEmailCode}
                                accepted={accepted}
                                setAccepted={setAccepted}
                                onSendEmail={sendEmailCode}
                                onVerifyCode={verifyEmailCode}
                                onComplete={complete}
                                onSkip={skipEmail}
                                loading={loading}
                                error={emailError}
                            />
                        )}
                    </>
                )}
            </ModalCard>
        </MainModal>
    )
}

export default WalletConnectModal
