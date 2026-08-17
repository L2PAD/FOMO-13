import useFetch from "../../hooks/useFetch"
import { useStyles } from "./styles"
import CreateMember from "./members/create_member"
import CreatePartner from "./partners/create_partner"
import Members from "./members"
import Partners from "./partners"

export default function AboutUs() {
    const 
    { 
        wrapper,
        rows,
        subTitle,
        itemsWrapper,
        members,
        title
    } = useStyles()
    const {data,loading} = useFetch('about')   
    
  return (
    <div className={wrapper}>
        <h2 className={title}>
            About Us
        </h2>
        <div className={rows}>
            <div className={itemsWrapper}>
                <div className={subTitle}>
                    Core team
                </div>
                <div className={members}>
                    <CreateMember
                    type={'member'}
                    />
                    <Members 
                    members={data?.data[0]?.members?.reverse()}
                    />
                </div>
            </div>
            <div className={itemsWrapper}>
                <div className={subTitle}>
                    Team members
                </div>
                <div className={members}>
                    <CreateMember
                    type={'team'}
                    />
                    <Members 
                    type={'team'}
                    members={data?.data[0]?.team?.reverse()}
                    />
                </div>
            </div>
            <div className={itemsWrapper}>
                <div className={subTitle}>
                    Partners
                </div>
                <div className={members}>
                    <CreatePartner/>
                    <Partners
                    partners={data?.data[0]?.partners?.reverse()}
                    />
                </div>
            </div>
        </div>
    </div>
  )
}
