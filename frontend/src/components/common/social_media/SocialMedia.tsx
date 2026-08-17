import { useEffect, useState } from 'react'
import TelegramIcon from '../../../assets/social_media/telegram.svg'
import DiscordIcon from '../../../assets/social_media/discord.svg'
import InstagramIcon from '../../../assets/social_media/instagram.svg'
import TikTokIcon from '../../../assets/social_media/tiktok.svg'
import TwitterIcon from '../../../assets/social_media/twitter.svg'
import YouTubeIcon from '../../../assets/social_media/youtube.svg'
import EmailIcon from '../../../assets/social_media/mail.svg'
import InputWithLabel from '../components_for_modals/input_with_label'
import { ISocialItem } from '../../types/global_types'
import FillButton from '../button/fill_button'
import upperCaseFirstLetter from '../../utils/upperCaseFirstLetter'
import inputsHandler from '../../utils/inputsHandler'
import saveChanges from '../../services/socialmedia/saveChanges'
import useFetch from '../../hooks/useFetch'
import Loader from '../loader'
import {useStyles} from './styles'
import reloadWindow from '../../utils/reloadWindow'

const icons : any = {
    'Telegram':TelegramIcon,
    'Discord':DiscordIcon,
    'Instagram':InstagramIcon,
    'TikTok':TikTokIcon,
    'Twitter':TwitterIcon,
    'YouTube':YouTubeIcon,
    'Email':EmailIcon,
}

const socialItemsInitial = [
    {
        name:'Telegram',
        url:'',
        icon:'Telegram'
    },
    {
        name:'Discord',
        url:'',
        icon:'Discord'
    },
    {
        name:'Instagram',
        url:'',
        icon:'Instagram'
    },
    {
        name:'TikTok',
        url:'',
        icon:'TikTok',
    },
    {
        name:'Twitter',
        url:'',
        icon:'Twitter'
    },
    {
        name:'YouTube',
        url:'',
        icon:'YouTube'
    },
    {
        name:'Email',
        url:'',
        icon:'Email'
    },
]

export default function SocialMedia() {
    const {data,loading} = useFetch('layout/socialmedia')
    const [socialItems,setSocialItems] = useState<Array<ISocialItem>>(socialItemsInitial)
    const {
        wrapper,
        title,
        items,
        socialItemWrapper,
        label
    } = useStyles()

    const changeHandler = (value: string,name : string) : void => {
        setSocialItems((prev) => {
            return prev.map((item: ISocialItem) => {
                if(item.name === name){
                    return {...item,url:value}
                }
                return item
            })
        })
    }   

    const confimSaveChanges = async () : Promise<void> => {
        const filteredSocialItems : Array<ISocialItem>
        = socialItems.filter((item : ISocialItem) =>  item.url.length)

        await saveChanges(filteredSocialItems)

        reloadWindow()
    }

    useEffect(() => {
        if(!data?.data?.items.length) return

        setSocialItems(socialItemsInitial.map((item:ISocialItem) => {
            const findedItem : ISocialItem | undefined
             = data?.data?.items.find((socialWithUrl:ISocialItem) => socialWithUrl.name === item.name)

            return {...item,url:findedItem?.url || ''}
        }))

    },[data])

    if(loading || !data?.data) return <Loader/>

  return (
    <div className={wrapper}>
        <h2 className={title}>
            Social media
        </h2>
        <div className={items}>
            {
                socialItems.map((socialItem: ISocialItem) => {
                    return (
                        <div key={socialItem.name} className={socialItemWrapper}>
                            <div className={label}>
                                <img src={icons[socialItem.icon]} alt="" />
                                {socialItem.name}
                            </div>
                            <InputWithLabel
                            placeholder='https://social-media.com'
                            name={socialItem.name}
                            value={socialItem.url}
                            onChange={(value,name) => changeHandler(value,socialItem.name)}
                            label={''}
                            />
                        </div>
                    )
                })
            }
        </div>
        <FillButton onClick={confimSaveChanges}>
            Save updates
        </FillButton>
    </div>
  )
}
