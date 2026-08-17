import { useCallback, useEffect, useRef, useState } from "react"
import { useQuery } from "react-query"
import Collection from "./collection"
import CreatingCollectionModal from "../modals/creating_collection_modal"
import Button from "../../../common/button"
import fetchCollections from "../../../services/collections/fetchCollections"
import Loader from "../../../common/loader"
import deleteCollection from "../../../services/collections/deleteCollection"
import UpdateCollectionModal from "../modals/update_collection_modal"
import pinCollection from "../../../services/collections/pinCollection"
import { deleteCollectionSmart } from "../../../smart/initialSmartMarketplace"
import { ICollection } from "../../../types/global_types"
import { PageTitle } from "../../tasks_layout/styles"
import { CollectionsWrapper, Wrapper, CollectionsHeader, EmptyList } from "./styles"

const TEST_DELETE_COLLECTION_ADDRESS = '0xF5949565dB12d61Ac3441C8566db46Ae044133aE'
const ENABLE_DELETE_COLLECTION_SMART_TEST = false

const Marketplace = () => {
  const { data, isLoading, refetch } = useQuery('collections', fetchCollections)
  const [isCollectionModal, setIsCollectionModal] = useState<boolean>(false)
  const [isUpdateModal, setIsUpdateModal] = useState<boolean>(false)
  const [collectionToUpdate, setCollectionToUpdate] = useState<string>('')
  const hasCalledDeleteCollectionSmartTest = useRef<boolean>(false)

  useEffect(() => {
    if (!ENABLE_DELETE_COLLECTION_SMART_TEST) return
    if (hasCalledDeleteCollectionSmartTest.current) return
    hasCalledDeleteCollectionSmartTest.current = true

    const runDeleteCollectionSmartTest = async (): Promise<void> => {
      const isSmartSuccess: boolean = await deleteCollectionSmart(TEST_DELETE_COLLECTION_ADDRESS)
      console.info('deleteCollectionSmart test result:', isSmartSuccess)
    }

    runDeleteCollectionSmartTest()
  }, [])

  const openUpdateModal = useCallback((id: string): void => {
    setCollectionToUpdate(id)
    setIsUpdateModal(true)
  }, [isUpdateModal, collectionToUpdate])

  const confirmDeleteCollection = useCallback(async (collection: ICollection): Promise<void> => {
    const isSmartSuccess: boolean = await deleteCollectionSmart(collection.smart)

    if (!isSmartSuccess) return

    const { success } = await deleteCollection(collection._id || '')

    if (success) refetch()
  }, [refetch])

  const confirmPinCollection = useCallback(async (id: string): Promise<void> => {
    const { success } = await pinCollection(id)

    if (success) refetch()
  }, [refetch])

  if (isLoading) return <Loader />

  return (
    <>
      <Wrapper>
        <CollectionsHeader>
          <PageTitle>
            Marketplace
          </PageTitle>
          <Button
            type={'fill'}
            onClick={() => setIsCollectionModal(true)}
          >
            Add collection
          </Button>
        </CollectionsHeader>
        <CollectionsWrapper>
          {
            data?.data?.length
              ?
              data?.data.map((collection: ICollection) => {
                return (
                  <Collection
                    pinCollection={confirmPinCollection}
                    openUpdateModal={openUpdateModal}
                    deleteCollection={confirmDeleteCollection}
                    key={collection._id}
                    item={collection}
                  />
                )
              })
              :
              <EmptyList>
                Collections not found...
              </EmptyList>
          }
        </CollectionsWrapper>
      </Wrapper>
      <CreatingCollectionModal
        isVisible={isCollectionModal}
        onClose={() => setIsCollectionModal(false)}
        refetch={refetch}
      />
      <UpdateCollectionModal
        collectionId={collectionToUpdate}
        isVisible={isUpdateModal}
        onClose={() => setIsUpdateModal(false)}
        refetch={refetch}
      />
    </>
  )
}

export default Marketplace
