import { FC, useEffect, useState } from "react"
import { useQuery } from "react-query"
import Modal from "../../../../common/modal"
import inputsHandler from "../../../../utils/inputsHandler"
import InputWithLabel from "../../../../common/components_for_modals/input_with_label"
import { ICollection } from "../../../../types/global_types"
import ModalDatePicker from "../../../../common/components_for_modals/modal_date_picker"
import ModalSelect from "../../../../common/components_for_modals/modal_select"
import ModalSelectProject from "../../../../common/components_for_modals/modal_select-project"
import getProjects from "../../../../services/projects/getProjects"
import Button from "../../../../common/button"
import { changeCreator,changeCreatorFee,changeFee } from "../../../../smart/initialSmartMarketplace"
import updateCollection from "../../../../services/collections/updateCollection"
import fetchCollectionById from "../../../../services/collections/fetchCollectionById"
import Loader from "../../../../common/loader"
import { 
    CreatingCollection, DatesInputsRow, DateWrapper, 
    DateWrapperLabel, InputsRow, ButtonWrapper
} from "./styles"

const typeItems = [    
    'FOMO Key',
    'Early rounds',
    'Public rounds',
    'NFT Launch'
]

interface IProps {
    collectionId:string
    isVisible:boolean
    onClose:() => void
    refetch:any
}

const UpdateCollectionModal : FC<IProps> = ({isVisible,onClose,refetch,collectionId}) => {
    const [loading,setLoading] = useState<boolean>(false)
    const {data} = useQuery('projects',() => getProjects('all/active'),{refetchOnWindowFocus:false})
    const collection = useQuery(['collection',collectionId],() => fetchCollectionById(collectionId),{refetchOnWindowFocus:false})
    const [collectionData,setCollectionData] = useState<ICollection | undefined>()

    const confirmUpdateCollection = async () : Promise<void> => {
        setLoading(true) 

        if(!collectionData) return

        const oldCollection : ICollection = collection.data?.data
        
        if(oldCollection.creator !== collectionData.creator){
            await changeCreator(oldCollection.smart,collectionData.creator || '')
        }

        if(oldCollection.royalty !== collectionData.royalty){
            await changeFee(oldCollection.smart,collectionData.royalty)
        }

        if(oldCollection.creatorFee !== collectionData.creatorFee){
            await changeCreatorFee(oldCollection.smart,collectionData.creatorFee)
        }

        const {success} = await updateCollection(collectionData)

        if(success) refetch()
            
        onClose()
        setLoading(false) 
    }
    
    useEffect(() => {
        collection.data?.data[0] && setCollectionData(collection.data?.data[0])
    },[collection])

    if(loading) return <Loader/>

  return (
    isVisible && collectionData
    ?
    <Modal
    onClose={onClose}
    title="Update collection"
    variant={'big'}
    >
        <CreatingCollection>
            <InputsRow>
                <InputWithLabel
                placeholder={'FOMO COLLECTION'}
                onChange={(value:string) => inputsHandler('name',value,setCollectionData)}
                label={'Collection name'}
                value={collectionData.name}
                />
                <InputWithLabel
                placeholder={'https://metadata/nft_metadata'}
                onChange={(value:string) => inputsHandler('metadataLink',value,setCollectionData)}
                label={'Metadata API'}
                value={collectionData.metadataLink || ''}
                />
            </InputsRow>
            <InputsRow>
                <InputWithLabel
                placeholder={'ERC-721'}
                onChange={(value:string) => inputsHandler('tokenStandart',value,setCollectionData)}
                label={'Token standart'}
                value={collectionData.tokenStandart || ''}
                />
                <InputWithLabel
                type={'number'}
                placeholder={'5'}
                onChange={(value:string) => inputsHandler('nftQuantity',Number(value),setCollectionData)}
                label={'NFT Quantity'}
                value={String(collectionData.nftQuantity)}
                />
            </InputsRow>
            <InputsRow>
                <InputWithLabel
                type={'number'}
                placeholder={'5'}
                onChange={(value:string) => inputsHandler('royalty',Number(value),setCollectionData)}
                label={'Royalty %'}
                value={String(collectionData.royalty)}
                />
                <InputWithLabel
                placeholder={'0xD28e844A6dC6a89BaC7b46c54bC7C7F40033Aa79'}
                onChange={(value:string) => inputsHandler('creator',value,setCollectionData)}
                label={'Creator address'}
                value={collectionData.creator || ''}
                />
            </InputsRow>
            <InputsRow>
                <InputWithLabel
                type={'number'}
                placeholder={'5'}
                onChange={(value:string) => inputsHandler('creatorFee',Number(value),setCollectionData)}
                label={'Creator fee %'}
                value={String(collectionData.creatorFee)}
                />
                <InputWithLabel
                placeholder={'0'}
                onChange={(value:string) => inputsHandler('revenue',value,setCollectionData)}
                label={'Revenue'}
                value={String(collectionData.revenue)}
                />
            </InputsRow>
            <InputsRow>
                <ModalSelect
                items={typeItems}
                label={'Type'}
                name={'type'}
                value={collectionData.type}
                onChange={(value:any,name:string) => inputsHandler(name,value,setCollectionData)}
                />
                <ModalSelectProject
                label={'Project'}
                // @ts-ignore
                project={collectionData.project}
                items={data?.data || []}
                onChange={(value:any) => inputsHandler('project',value,setCollectionData)}
                />
            </InputsRow>
            <DatesInputsRow>
                <InputWithLabel
                type={'number'}
                placeholder={'5'}
                onChange={(value:string) => inputsHandler('mintPrice',Number(value),setCollectionData)}
                label={'Mint price'}
                value={String(collectionData.mintPrice)}
                />
                <DateWrapper>
                    <DateWrapperLabel>
                        Last funding
                    </DateWrapperLabel>
                    <ModalDatePicker 
                    name={'lastFunding'} 
                    date={new Date(collectionData.lastFunding)} 
                    onChange={(value:Date[],name) => {
                        // @ts-ignore
                        inputsHandler(name,value,setCollectionData)
                    }} 
                    />
                </DateWrapper>
            </DatesInputsRow>
            <ButtonWrapper>
                <Button
                onClick={confirmUpdateCollection}
                type={'fill'}
                >
                    Confirm
                </Button>
            </ButtonWrapper>
        </CreatingCollection>
    </Modal>
    :
    <></>
  )
}

export default UpdateCollectionModal
