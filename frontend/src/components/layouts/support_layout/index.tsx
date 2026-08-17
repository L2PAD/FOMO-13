import { createContext, useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { setItems } from "../../../store/slices/searchMessagesSlice"
import useFetch from "../../hooks/useFetch"
import getAccessToken from "../../utils/getAccessToken"
import Header from "./support_list_layout/header"
import SupportTable from "./support_list_layout/support_table"
import Tabs from "../../common/tabs"
import { TabsWrapper } from "./styles"
import { useQuery } from "react-query"
import fetchMessages from "../../services/supports/fetchMessages"
import fetchReports from "../../services/supports/fetchReports"
import ReportsTable from "./reports_list_layout/support_table"
import ReportsHeader from "./reports_list_layout/header"
import fetchComments from "../../services/comments/fetchComments"
import CommentsTable from "./comment_list_layout/support_table"
import CommentsHeader from "./comment_list_layout/header"

const tabs = [
  'Messages',
  'Reports',
  'Comments',
]

export interface ISupportContext {
  reports: Array<any>
  comments: Array<any>
}

export const SupportContext = createContext<ISupportContext>({ reports: [],comments:[] })

const SupportItems = () => {
  const [reports, setReports] = useState<Array<any>>([])
  const [comments, setComments] = useState<Array<any>>([])
  const [activeTab, setActiveTab] = useState<string>(tabs[0])
  const dispatch = useDispatch()
  const { isLoading } = useQuery(['support', activeTab], async () => {
    if (activeTab === 'Messages') {
      const { data } = await fetchMessages()
      dispatch(setItems(data?.data || []))
    }
    if (activeTab === 'Reports') {
      const { data } = await fetchReports()
      setReports(data?.data || [])
    }
    if (activeTab === 'Comments') {
      const { data } = await fetchComments()
      setComments(data?.data || [])
    }
  }, { refetchOnWindowFocus: false, refetchInterval: 30000 })

  return (
    <SupportContext.Provider value={{ reports: reports,comments }}>
      <TabsWrapper>
        <Tabs
          activeTab={activeTab}
          onChange={(value: string) => setActiveTab(value)}
          tabs={tabs}
        />
      </TabsWrapper>
      {
        activeTab === 'Comments'
          ?
          <>
            <CommentsHeader/>
            <CommentsTable
            loading={isLoading}
            />
          </>
          :
          activeTab === 'Reports'
            ?
            <>
              <ReportsHeader />
              <ReportsTable
                loading={isLoading}
              />
            </>
            :
            <>
              <Header />
              <SupportTable
                loading={isLoading}
              />
            </>
      }
    </SupportContext.Provider>
  )
}

export default SupportItems
