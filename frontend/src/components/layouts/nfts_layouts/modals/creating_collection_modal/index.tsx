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
import { addCollection, addressNft } from "../../../../smart/initialSmartMarketplace"
import {
    CreatingCollection, DatesInputsRow, DateWrapper,
    DateWrapperLabel, InputsRow, ButtonWrapper
} from "./styles"
import Loader from "../../../../common/loader"
import createCollection from "../../../../services/collections/createCollection"

const typeItems = [
    'FOMO Key',
    'Early rounds',
    'Public rounds',
    'NFT Launch'
]

interface IProps {
    isVisible: boolean
    onClose: () => void
    refetch: any
}

const CreatingCollectionModal: FC<IProps> = ({ isVisible, onClose, refetch }) => {
    const [loading, setLoading] = useState<boolean>(false)
    const { data } = useQuery('projects', () => getProjects('all?section=projects'))
    const [collectionData, setCollectionData] = useState<ICollection>({
        name: '',
        type: 'FOMO Key',
        smart: addressNft,
        royalty: 0,
        project: null,
        nftQuantity: 0,
        nfts: [],
        creatorFee: 0,
        revenue: 0,
        mintPrice: 0,
        lastFunding: new Date(),
        tokenStandart: '',
        isPinned: false,
    })

    const confirmCreateCollection = async (): Promise<void> => {
        setLoading(true)

        const isSmartSuccess: boolean = await addCollection(
            collectionData.smart,
            collectionData.royalty,
            collectionData.creator || '',
            collectionData.creatorFee
        )

        if (!isSmartSuccess) return

        const { success } = await createCollection(collectionData, "699ffb52f6e73683c0b5881a")

        if (success) refetch()

        onClose()
        setLoading(false)
    }


    if (loading) return <Loader />

    return (
        isVisible
            ?
            <Modal
                onClose={onClose}
                title="Add collection"
                variant={'big'}
            >
                <CreatingCollection>
                    <InputsRow>
                        <InputWithLabel
                            placeholder={'FOMO COLLECTION'}
                            onChange={(value: string) => inputsHandler('name', value, setCollectionData)}
                            label={'Collection name'}
                            value={collectionData.name}
                        />
                        <InputWithLabel
                            placeholder={'https://metadata/nft_metadata'}
                            onChange={(value: string) => inputsHandler('metadataLink', value, setCollectionData)}
                            label={'Metadata API'}
                            value={collectionData.metadataLink || ''}
                        />
                    </InputsRow>
                    <InputsRow>
                        <InputWithLabel
                            type={'number'}
                            placeholder={'5'}
                            onChange={(value: string) => inputsHandler('nftQuantity', Number(value), setCollectionData)}
                            label={'NFT Quantity'}
                            value={String(collectionData.nftQuantity)}
                        />
                        <InputWithLabel
                            placeholder={'0x70EB7db470063c9f90c103C4526c3f91b82Bf535'}
                            onChange={(value: string) => inputsHandler('smart', value, setCollectionData)}
                            label={'Smart contract'}
                            value={collectionData.smart || ''}
                        />
                    </InputsRow>
                    <InputsRow>
                        <InputWithLabel
                            type={'number'}
                            placeholder={'5'}
                            onChange={(value: string) => inputsHandler('royalty', Number(value), setCollectionData)}
                            label={'Royalty %'}
                            value={String(collectionData.royalty)}
                        />
                        <InputWithLabel
                            placeholder={'0xD28e844A6dC6a89BaC7b46c54bC7C7F40033Aa79'}
                            onChange={(value: string) => inputsHandler('creator', value, setCollectionData)}
                            label={'Creator address'}
                            value={collectionData.creator || ''}
                        />
                    </InputsRow>
                    <InputsRow>
                        <InputWithLabel
                            type={'number'}
                            placeholder={'5'}
                            onChange={(value: string) => inputsHandler('creatorFee', Number(value), setCollectionData)}
                            label={'Creator fee %'}
                            value={String(collectionData.creatorFee)}
                        />
                        <InputWithLabel
                            placeholder={'0'}
                            onChange={(value: string) => inputsHandler('revenue', value, setCollectionData)}
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
                            onChange={(value: any, name: string) => inputsHandler(name, value, setCollectionData)}
                        />
                        <ModalSelectProject
                            label={'Project'}
                            // @ts-ignore
                            project={collectionData.project}
                            items={data?.data || []}
                            onChange={(value: any) => inputsHandler('project', value, setCollectionData)}
                        />
                    </InputsRow>
                    <DatesInputsRow>
                        <InputWithLabel
                            type={'number'}
                            placeholder={'5'}
                            onChange={(value: string) => inputsHandler('mintPrice', Number(value), setCollectionData)}
                            label={'Mint price'}
                            value={String(collectionData.mintPrice)}
                        />
                        <DateWrapper>
                            <DateWrapperLabel>
                                Last funding
                            </DateWrapperLabel>
                            <ModalDatePicker
                                name={'lastFunding'}
                                date={collectionData.lastFunding}
                                onChange={(value: Date[], name) => {
                                    // @ts-ignore
                                    inputsHandler(name, value, setCollectionData)
                                }}
                            />
                        </DateWrapper>
                    </DatesInputsRow>
                    <InputsRow>
                        <InputWithLabel
                            placeholder={'ERC-721'}
                            onChange={(value: string) => inputsHandler('tokenStandart', value, setCollectionData)}
                            label={'Token standart'}
                            value={collectionData.tokenStandart || ''}
                        />
                    </InputsRow>
                    <ButtonWrapper>
                        <Button
                            onClick={confirmCreateCollection}
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

export default CreatingCollectionModal
