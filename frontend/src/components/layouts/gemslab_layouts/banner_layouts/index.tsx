import { useState } from "react"
import { IBannerItem } from "../../../types/global_types"
import useFetch from "../../../hooks/useFetch"
import CreateBanner from "./modals/create_banner"
import Button from "../../../common/button"
import { useStyles } from "./styles"
import BannerItem from "./item"

const BannerLayout = () => {
  const {data,updateFetchData} = useFetch('banner/gemslab')
  const [isVisible,setIsVisible] = useState<boolean>(false)
  const {
    Wrapper,
    Head,
    List
  } 
  =
  useStyles()

  const addBannerItem = (item:IBannerItem) : void => {
    updateFetchData(data?.data ? [item,...data.data] : [item])  
  }

  const removeBannerItem = (id:string) : void => {
    updateFetchData(data?.data?.filter((item:IBannerItem) => {
      return item._id !== id
    }))
  }

  return (
    <>
      <div className={Wrapper}>
        <div
        className={Head}
        >
        <h1>GemsLab Slides</h1>
          <Button
          type={'bordered'}
          onClick={() => setIsVisible(true)}
          >
            Create slide
          </Button>
        </div>
        <div
        className={List}
        >
          {
            data?.data?.length
            ?
            data.data.map((item:IBannerItem) => {
              return <BannerItem
              onDelete={removeBannerItem}
              key={item._id}
              item={item}
              />
            })
            :
            <></>
          }
        </div>
      </div>
      <CreateBanner
      addItemToList={addBannerItem}
      isVisible={isVisible}
      onClose={setIsVisible}
      page={'gemslab'}
      />
    </>
  )
}

export default BannerLayout
