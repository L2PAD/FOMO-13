import {FC, useEffect, useState } from "react"
import { changeEndedPoolToken, getAllPartnersFromPool, mainPoolAddress } from "../../../../smart/initialSmartMain"
import startClaim from "../../../../services/projects/startClaim"
import reloadWindow from "../../../../utils/reloadWindow"
import InputWithLabel from "../../../../common/components_for_modals/input_with_label"
import Modal from "../../../../common/modal"
import Button from "../../../../common/button"
import Loader from "../../../../common/loader"
import { Head, InputsWrapper, Key, Value } from "./styles"

const inputs = [
    {
        label:'Token:',
        name:'token',
        placeholder:'0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948',
        type:'text',
    },
    {
        label:'Decimals:',
        name:'decimals',
        placeholder:'18',
        type:'number',
    },
    {
        label:'Sum invest:',
        name:'sumInvest',
        placeholder:'10000',
        type:'number',
    },
    {
        label:'Sum token:',
        name:'sumToken',
        placeholder:'10000',
        type:'number',
    },
    {
        label:'Ticker',
        name:'ticker',
        placeholder:'ETH',
        type:'text',
    },
]

interface IProps {
    poolId:number
    projectId:string
    modalHandler:(value:any) => void 
    isVisible:boolean 
}

interface IData {
    token:string 
    decimals:number,
    sumInvest:number,
    sumToken:number
    ticker:string
}

const ClaimModal : FC<IProps> = ({poolId,projectId,modalHandler,isVisible}) => {
    const [loading,setLoading] = useState<boolean>(false)
    const [data,setData] = useState<IData>({token:'',decimals:18,sumInvest:0,sumToken:0,ticker:''})

    const inputsHanlder = (name:string,value:any) => {
        setData((prev) => {
            return {...prev,[name]:value}
        })
    }

    const confirmClaim = async () => {
        if(!data.token) return 

        const {success} = await changeEndedPoolToken(
            data.token,
            poolId,
            Number(data.sumToken),
            data.decimals,
            Number(data.sumInvest)
        )

        if(success){
            const result = await startClaim(projectId,data.ticker)

            result.success && reloadWindow()
        }
    }

    useEffect(() => {
        getAllPartnersFromPool(poolId).then(({sumInvest}) => {
            setData((prev:IData) => {
                return {...prev,sumInvest:sumInvest || 0}
            })
        })
    },[])

    if(loading) return <Loader/>

  return (
    isVisible 
    ?
    <Modal
    variant={'medium'}
    onClose={() => modalHandler(false)}
    title={'Start claim'}
    >
            <Head>
                <Key>Transfer funds to the smart contract address before confirmation: </Key>
                <Value>{mainPoolAddress}</Value>
            </Head>
        <InputsWrapper>
            {
                inputs.map((item:any,index:number) => {
                    return (
                        <InputWithLabel
                        placeholder={item.placeholder}
                        key={item.name}
                        label={item.label}
                        // @ts-ignore
                        value={data[item.name]}
                        onChange={(value:any) => inputsHanlder(item.name,value)} 
                        />
                    )
                })
            }
            <Button
            type={'bordered'}
            onClick={confirmClaim}
            >
                Confirm
            </Button>
        </InputsWrapper>
    </Modal>
    :
    <></>
  )
}

export default ClaimModal
