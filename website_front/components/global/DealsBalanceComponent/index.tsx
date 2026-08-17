import React, { createContext, useContext, useEffect, useState } from 'react'
import styled from 'styled-components'
import { Button } from '../common/Button'
import WithdrawModal from '../../layouts/projects/modals/WithdrawModal'
import { AuthContext, BalanceContext } from '../Layout'
import { getUserTotalBalance } from '../../../smart/smartOTCP2P'
import DepositModal from '../../layouts/projects/modals/DepositModal'
import { useRouter } from 'next/router'

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    gap: 4px;
    align-items: center;

    .deals-balance-btn {
        border-radius: 8px !important;
    }

    @media (max-width: 1120px) {
        button{
            width: 100%;
        }
    }

    @media (max-width: 768px) {
        gap: 10px;
        button{
            width: 46px;
            span{
                display: none;
            }

        }
    }
`

export interface IWithdrawContext {
    isWithdraw: boolean
    isDeposit: boolean
    isWithdrawAccess: boolean
    toggleWithdrawModal: (value: boolean) => void
    toggleDepositModal: (value: boolean) => void
    toggleWithdrawAccess: (value: boolean) => void
}

export const WithdrawContext = createContext<IWithdrawContext>({
    isWithdraw: false,
    isDeposit: false,
    isWithdrawAccess: false,
    toggleWithdrawModal: (value: boolean) => { },
    toggleDepositModal: (value: boolean) => { },
    toggleWithdrawAccess: (value: boolean) => { }
})

export type UserDealsBalance = {
    eth: number
    usdc: number
    isLoading?: boolean
    refetchBalance?: () => Promise<void>
}


interface IDealsBalanceComponentProps {
    className?: string;
}

const DealsBalanceComponent: React.FC<IDealsBalanceComponentProps> = ({ className }) => {
    const [isWithdraw, setIsWithdraw] = useState<boolean>(false)
    const [isDeposit, setIsDeposit] = useState<boolean>(false)
    const [isWithdrawAccess, setIsWithdrawAccess] = useState<boolean>(false)
    const balance = useContext(BalanceContext)
    const query = useRouter().query

    useEffect(() => {
        const action: 'deposit' | 'withdraw' | undefined = query.action as 'deposit' | 'withdraw' | undefined
        if (action === 'deposit') {
            setIsDeposit(true)
        } else if (action === 'withdraw') {
            setIsWithdraw(true)
        }
    }, [query])

    return (
        <WithdrawContext.Provider
            value={{
                isDeposit,
                isWithdraw,
                isWithdrawAccess,
                toggleWithdrawModal: (value: boolean) => setIsWithdraw(value),
                toggleDepositModal: (value: boolean) => setIsDeposit(value),
                toggleWithdrawAccess: (value: boolean) => setIsWithdrawAccess(value),
            }
            }
        >
            <Wrapper className={className}>
                <Button
                    className="contact-btn deals-balance-btn"
                    variant="outlined"
                    onClick={() => setIsDeposit(true)}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.07418 10.8741H2.47437C1.70119 10.8741 1.07439 10.2473 1.07437 9.47415L1.07422 4.22426C1.0742 3.45104 1.701 2.82422 2.47422 2.82422H10.8739C11.6471 2.82422 12.2739 3.45066 12.2739 4.22388L12.2739 6.67422M1.42395 5.27413H11.9239M11.4536 11.1776L11.4536 9.70403M11.4536 9.70403L11.4536 8.23042M11.4536 9.70403H9.98002M11.4536 9.70403H12.9273" stroke="#04A584" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Deposit</span>
                </Button >
                <Button
                    className="contact-btn deals-balance-btn"
                    leftIcon={
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.9648 11.0245H2.36499C1.59181 11.0245 0.965016 10.3977 0.964994 9.62454L0.964844 4.37465C0.964822 3.60143 1.59163 2.97461 2.36484 2.97461H10.7645C11.5377 2.97461 12.1646 3.60105 12.1645 4.37427L12.1646 6.82461M1.31457 5.42452H11.8146M10.0643 9.35952L13.0343 9.35939" stroke="#04A584" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    }
                    variant={'outlined'}
                    onClick={() => setIsWithdraw(true)}>

                    <span>Withdraw</span>
                </Button>
            </Wrapper>
            <WithdrawModal
                balance={balance}
                isVisible={isWithdraw}
                onClose={() => setIsWithdraw(false)}
            />
            <DepositModal
                isVisible={isDeposit}
                onClose={(isWidthraw?: boolean) => {
                    setIsDeposit(false)
                }}
            />
        </WithdrawContext.Provider >

    )
}

export default DealsBalanceComponent
