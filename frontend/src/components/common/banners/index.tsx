import React, { useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import CreateButton from '../button/create_button'
import CreateBanner from '../../layouts/gemslab_layouts/banner_layouts/modals/create_banner'
import { IBannerItem } from '../../types/global_types'
import fetchBanners from '../../services/banner/fetchBanners'
import { SectionItems, SectionTitle, SectionWrapper, Wrapper } from './styles'
import BannerItem from '../../layouts/gemslab_layouts/banner_layouts/item'
import deleteBannerItem from '../../services/banner/deleteBannerItem'

export type BannerPages = 'funding-feed' | 'projects' | 'gemslab' | 'funds' | 'persons' | 'unlocking'

const PageBanners = () => {
  const [selectedPage, setSelectedPage] = useState<BannerPages>()
  const [isCreateBanner, setIsCreateBanner] = useState<boolean>(false)
  const [banners, setBanners] = useState<Array<IBannerItem>>([])
  const { data } = useQuery('banner', fetchBanners, {
    onSuccess: ({ data }) => {
      if (data?.length) setBanners(data)
    }
  })

  const confirmDeleteBanner = async (itemId: string): Promise<void> => {
    setBanners(banners?.filter((banner: IBannerItem) => {
      return banner._id !== itemId
    }))
  }

  const { fundingFeedBanners, projectsBanners, fundsBanners, personsBanners, unlockingBanners } = useMemo(() => {
    const fundingFeedBanners: Array<IBannerItem>
      =
      banners.filter((item: IBannerItem) => item.page === 'funding-feed')

    const projectsBanners: Array<IBannerItem>
      =
      banners.filter((item: IBannerItem) => item.page === 'projects')

    const fundsBanners: Array<IBannerItem>
      =
      banners.filter((item: IBannerItem) => item.page === 'funds')

    const personsBanners: Array<IBannerItem>
      =
      banners.filter((item: IBannerItem) => item.page === 'persons')

    const unlockingBanners: Array<IBannerItem>
      =
      banners.filter((item: IBannerItem) => item.page === 'unlocking')

    return { fundingFeedBanners, projectsBanners, fundsBanners, personsBanners, unlockingBanners }
  }, [banners])

  return (
    <>
      <Wrapper>
        <h2>
          Banners
        </h2>
        <SectionWrapper>
          <SectionTitle>
            Crypto/Funding Feed
          </SectionTitle>
          <SectionItems>
            <CreateButton
              width='250px'
              height='250px'
              onClick={() => {
                setIsCreateBanner(true)
                setSelectedPage('funding-feed')
              }}
            />
            {
              fundingFeedBanners.map((item: IBannerItem) => {
                return (
                  <BannerItem
                    onDelete={confirmDeleteBanner}
                    key={item._id}
                    item={item}
                  />
                )
              })
            }
          </SectionItems>
        </SectionWrapper>

        <SectionWrapper>
          <SectionTitle>
            Crypto/Projects
          </SectionTitle>
          <SectionItems>
            <CreateButton
              width='250px'
              height='250px'
              onClick={() => {
                setIsCreateBanner(true)
                setSelectedPage('projects')
              }}
            />
            {
              projectsBanners.map((item: IBannerItem) => {
                return (
                  <BannerItem
                    onDelete={confirmDeleteBanner}
                    key={item._id}
                    item={item}
                  />
                )
              })
            }
          </SectionItems>
        </SectionWrapper>

        <SectionWrapper>
          <SectionTitle>
            Crypto/Funds
          </SectionTitle>
          <SectionItems>
            <CreateButton
              width='250px'
              height='250px'
              onClick={() => {
                setIsCreateBanner(true)
                setSelectedPage('funds')
              }}
            />
            {
              fundsBanners.map((item: IBannerItem) => {
                return (
                  <BannerItem
                    onDelete={confirmDeleteBanner}
                    key={item._id}
                    item={item}
                  />
                )
              })
            }
          </SectionItems>
        </SectionWrapper>

        <SectionWrapper>
          <SectionTitle>
            Crypto/Persons
          </SectionTitle>
          <SectionItems>
            <CreateButton
              width='250px'
              height='250px'
              onClick={() => {
                setIsCreateBanner(true)
                setSelectedPage('persons')
              }}
            />
            {
              personsBanners.map((item: IBannerItem) => {
                return (
                  <BannerItem
                    onDelete={confirmDeleteBanner}
                    key={item._id}
                    item={item}
                  />
                )
              })
            }
          </SectionItems>
        </SectionWrapper>

        <SectionWrapper>
          <SectionTitle>
            Crypto/Unlocking
          </SectionTitle>
          <SectionItems>
            <CreateButton
              width='250px'
              height='250px'
              onClick={() => {
                setIsCreateBanner(true)
                setSelectedPage('unlocking')
              }}
            />
            {
              unlockingBanners.map((item: IBannerItem) => {
                return (
                  <BannerItem
                    onDelete={confirmDeleteBanner}
                    key={item._id}
                    item={item}
                  />
                )
              })
            }
          </SectionItems>
        </SectionWrapper>
      </Wrapper>
      <CreateBanner
        onClose={() => setIsCreateBanner(false)}
        addItemToList={(item: IBannerItem) => setBanners((prev: Array<IBannerItem>) => [item, ...prev])}
        isVisible={isCreateBanner}
        page={selectedPage || ''}
      />
    </>
  )
}

export default PageBanners
