import React, { useEffect, useState } from 'react'
import { Wrapper, Row, Actions } from './styles'
import { useRouter } from 'next/navigation'
import { getMoneyBalance } from '../../../../http/money'
import { EyeIcon } from 'lucide-react'

const BALANCE_VISIBILITY_STORAGE_KEY = 'fomo-balance-visibility'

const HiddenValue = () => (
    <svg width="12" height="3" viewBox="0 0 12 3" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 0C5.175 0 4.5 0.675 4.5 1.5C4.5 2.325 5.175 3 6 3C6.825 3 7.5 2.325 7.5 1.5C7.5 0.675 6.825 0 6 0ZM10.5 0C9.675 0 9 0.675 9 1.5C9 2.325 9.675 3 10.5 3C11.325 3 12 2.325 12 1.5C12 0.675 11.325 0 10.5 0ZM1.5 0C0.675 0 0 0.675 0 1.5C0 2.325 0.675 3 1.5 3C2.325 3 3 2.325 3 1.5C3 0.675 2.325 0 1.5 0Z" fill="#738094" />
    </svg>
)

const BalanceComponent = () => {
    const router = useRouter()
    // INTERNAL FOMO Balance ONLY (funds the user deposited to our platform).
    // We NEVER read the user's on-chain wallet balance here.
    const [available, setAvailable] = useState(0)
    const [total, setTotal] = useState(0)
    const [isVisible, setIsVisible] = useState(true)

    const loadBalance = () => {
        getMoneyBalance('USDC')
            .then((b) => { setAvailable(b.available || 0); setTotal(b.total || 0) })
            .catch(() => {})
    }

    useEffect(() => {
        loadBalance()
        const id = setInterval(loadBalance, 15000)
        return () => clearInterval(id)
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const savedVisibility = window.localStorage.getItem(BALANCE_VISIBILITY_STORAGE_KEY)
        if (savedVisibility === null) return
        setIsVisible(savedVisibility === 'true')
    }, [])

    const handleToggleVisibility = () => {
        setIsVisible((prev) => {
            const nextValue = !prev
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(BALANCE_VISIBILITY_STORAGE_KEY, String(nextValue))
            }
            return nextValue
        })
    }

    const renderValue = (value: string) => {
        if (!isVisible) {
            return <HiddenValue />
        }
        return value
    }


    return (
        <Wrapper variant='main'>
            <div className='title'>
                FOMO Balance
                <button onClick={handleToggleVisibility}>
                    {
                        isVisible
                            ?
                            <EyeIcon size={24} strokeWidth={1} stroke='#05A584' />
                            :
                            <svg width="21" height="16" viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18.5273 15.5L11.0273 8L3.52734 0.5M8.32734 6.44157C7.95393 6.85326 7.72734 7.39403 7.72734 7.98631C7.72734 9.27609 8.80186 10.3217 10.1273 10.3217C10.7385 10.3217 11.2963 10.0994 11.72 9.73338M18.5662 10.3217C19.3924 9.08482 19.7273 8.07613 19.7273 8.07613C19.7273 8.07613 17.5427 1.1 10.1273 1.1C9.71104 1.1 9.31122 1.12199 8.92734 1.16349M15.5273 13.3494C14.1499 14.2281 12.3767 14.8495 10.1273 14.8127C2.80427 14.693 0.527344 8.07613 0.527344 8.07613C0.527344 8.07613 1.5852 4.69808 4.72734 2.64332" stroke="#728094" stroke-linecap="round" />
                            </svg>
                    }
                </button>
            </div>
            <Row>
                <span>Available:</span>
                <div data-testid="sidebar-fomo-available">
                    {renderValue(`${available.toFixed(2)} USDC`)}
                </div>
            </Row>
            <div className='line'>
                <svg width="220" height="1" viewBox="0 0 220 1" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="219.5" y1="0.5" x2="0.5" y2="0.5" stroke="#F0F2F5" strokeLinecap="round" strokeDasharray="4 4" />
                </svg>
            </div>
            <Row>
                <span>Total balance:</span>
                <div data-testid="sidebar-fomo-total">
                    {renderValue(`${total.toFixed(2)}$`)}
                </div>
            </Row>
            <Actions>
                <button
                    onClick={() => router.push('/utility/?action=deposit')}
                    className='deposit-button'>
                    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.83329 10.0832H2.16685C1.24639 10.0832 0.500205 9.33704 0.500178 8.41658L0.5 2.16671C0.499974 1.24622 1.24617 0.5 2.16667 0.5H12.1663C13.0868 0.5 13.833 1.24576 13.833 2.16626L13.833 5.08333M0.916346 3.41656H13.4163M12.8564 10.4446L12.8565 8.69025M12.8565 8.69025L12.8564 6.93595M12.8565 8.69025H11.1021M12.8565 8.69025H14.6108" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Deposit
                </button>
                <button
                    disabled={available === 0}
                    onClick={() => router.push('/utility/?action=withdraw')}
                    className='withdraw-button'>
                    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.83329 10.0832H2.16685C1.24639 10.0832 0.500205 9.33704 0.500178 8.41658L0.5 2.16671C0.499974 1.24622 1.24617 0.5 2.16667 0.5H12.1663C13.0868 0.5 13.833 1.24576 13.833 2.16626L13.833 5.08333M0.916346 3.41656H13.4163M11.3327 8.10108L14.8684 8.10092" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Withdraw
                </button>
            </Actions>
        </Wrapper>
    )
}

export default BalanceComponent
