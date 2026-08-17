import { FC } from "react"
import { ICollection, ICollectionTypes } from "../../../../types/global_types"
import loader from "../../../../services/loader"
import { CollectionWrapper, InfoButtons, InfoItem, InfoLabel, InfoRow, InfoValue, NftsRow, NftsTitle, ProjectInfoWrapper,ProjectWrapper } from "./styles"
import Button from "../../../../common/button"
import DeleteIcon from "../../../../common/Icons/delete_icon"
import { EditIcon } from "../../../../../assets"
import PinIcon from "../../../../../assets/PinIcon"

interface IProps {
    item:ICollection
    deleteCollection:(collection:ICollection) => Promise<void>
    openUpdateModal:(id:string) => void
    pinCollection: (id:string) => Promise<void>
}

export const getCollectionTypeName = (type:keyof ICollectionTypes) : string => {
    const types : ICollectionTypes = {
        'FOMO Key':'FOMO Key',
        'Early rounds':'Early rounds',
        'Public rounds':'Public rounds',
        'NFT Launch':'NFT Launch'
    }

    return types[type]
}
const Collection : FC<IProps> = ({item,deleteCollection,openUpdateModal,pinCollection}) => {
    
  return (
    <CollectionWrapper>
        <InfoRow>
            <InfoItem>
                <InfoLabel>
                    Project
                </InfoLabel>
                <ProjectWrapper>
                    <img
                    src={loader(String(item?.project?.logo))}
                    alt={item?.project?.name}
                    />
                    <ProjectInfoWrapper>
                        <div>
                            {item?.project?.name}
                        </div>
                        <span>
                            {item?.project?.banner}
                        </span>
                    </ProjectInfoWrapper>
                </ProjectWrapper>
            </InfoItem>
            <InfoItem>
                <InfoLabel>
                    Type
                </InfoLabel>
                <InfoValue>
                    {item.type}
                </InfoValue>
            </InfoItem>
            <InfoItem>
                <InfoLabel>
                    Smart contract
                </InfoLabel>
                <InfoValue>
                    {item.smart}
                </InfoValue>
            </InfoItem>
            <InfoItem>
                <InfoLabel>
                    Royalty
                </InfoLabel>
                <InfoValue>
                    {item.royalty}
                </InfoValue>
            </InfoItem>
            <InfoButtons>
                <Button
                onClick={() => pinCollection(item._id || '')}
                type={'outlined'}
                >
                    <PinIcon 
                    fill={item.isPinned ? 'black' : "#0000007f"}
                    />
                </Button>
                <Button
                onClick={() => openUpdateModal(item._id || '')}
                type={'outlined'}
                >
                    <EditIcon/>
                </Button>
                <Button
                onClick={() => deleteCollection(item)}
                type={'outlined'}
                >
                    <DeleteIcon/>
                </Button>
            </InfoButtons>
        </InfoRow>
        <NftsRow>
            <NftsTitle>
                NFTS ({item.nfts.length})
            </NftsTitle>        
        </NftsRow>
    </CollectionWrapper>
  )
}

export default Collection
