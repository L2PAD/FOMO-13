import { useState } from "react"
import { useLocation, useHistory } from "react-router"
import getAccessToken from "../../../utils/getAccessToken"
import useFetch from "../../../hooks/useFetch"
import Typography from "../../../common/typography"
import { ITask } from "../../../types/global_types"
import useDates from "../../../hooks/useDates"
import { ArrowRightIcon } from "../../../../assets"
import Button from "../../../common/button"
import changeTaskStatus from "../../../services/tasks/changeTaskStatus"
import deleteTask from "../../../services/tasks/deleteTask"
import reloadWindow from "../../../utils/reloadWindow"
import {
  Wrapper,
  InfoItem,
  InfoRow,
  EventTimeWrapper,
  TaskHead,
  DescriptionWrapper,
  TableWrapper,
  TableBody,
  TableHead,
  TableList,
  TableItem,
  ActionBtns,
  TaskHeadColumn
} from "./styles"
import Loader from "../../../common/loader"

const TaskItemPage = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const navigation = useHistory()
  const location = useLocation()
  const { data } = useFetch(`tasks/item/${location.pathname.split('/').pop()}`,
    {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    }
  )
  const { days, hours, minutes } = useDates(
    String(data?.data?.date ?? ''),
    String(data?.data?.time ?? '')
  )
  const task: ITask | undefined = data?.data

  const confirmChangeRequestStatus = async (action: string, userId: string): Promise<void> => {
    if (!task) return

    setLoading(true)

    const { success } = await changeTaskStatus(task, action, userId)

    if (success) {
      reloadWindow()
    }

    setLoading(false)
  }

  const confirmDeleteTask = async (): Promise<void> => {
    setLoading(true)

    await deleteTask(task?._id || '')

    navigation.goBack()

    setLoading(false)
  }

  return (
    <>
      <Wrapper>
        <TaskHead>
          <TaskHeadColumn>
            <button
              onClick={() => navigation.goBack()}
            >
              <ArrowRightIcon />
            </button>
            <h1>Task page</h1>
          </TaskHeadColumn>
          <Button
            onClick={confirmDeleteTask}
            type={'bordered'}
            className={'decline-btn'}
          >
            Delete
          </Button>
        </TaskHead>
        <InfoRow>
          <InfoItem>
            <Typography variant={'h2'}>
              {task?.name}
            </Typography>
            <Typography variant={'p'}>
              Name
            </Typography>
          </InfoItem>
          <InfoItem>
            <Typography variant={'h2'}>
              {task?.link}
            </Typography>
            <Typography variant={'p'}>
              Link
            </Typography>
          </InfoItem>
          <InfoItem>
            <Typography variant={'h2'}>
              {task?.points}
            </Typography>
            <Typography variant={'p'}>
              Points
            </Typography>
          </InfoItem>
          {task?.type !== 'special' ? (
            <>
              <InfoItem>
                <Typography variant={'h2'}>
                  {task?.accessTier === 'prime' ? 'Prime' : 'Public'}
                </Typography>
                <Typography variant={'p'}>
                  Access
                </Typography>
              </InfoItem>
              <InfoItem>
                <Typography variant={'h2'}>
                  {task?.v2ActivityId || 'Not linked'}
                </Typography>
                <Typography variant={'p'}>
                  Earlyland activity
                </Typography>
              </InfoItem>
            </>
          ) : null}
          <InfoItem>
            <EventTimeWrapper>
              <i>{days}:{hours > 9 ? hours : `0${hours}`}:{minutes > 9 ? minutes : `0${minutes}`}</i>
              <span> dd hh mm</span>
            </EventTimeWrapper>
          </InfoItem>
        </InfoRow>
        <hr />
        <DescriptionWrapper>
          <Typography variant={'h2'}>
            Description
          </Typography>
          <div dangerouslySetInnerHTML={{ __html: String(task?.description) }}>
          </div>
        </DescriptionWrapper>
        <hr />
        <TableWrapper>
          <Typography variant={'h2'}>
            Review
          </Typography>
          <TableBody>
            <TableHead>
              <span>
                FOMO ID
              </span>
              <span>
                Email
              </span>
              <span>
                Name
              </span>
            </TableHead>
            <TableList>
              {
                task?.requests?.length
                  ?
                  task.requests.map((user: any) => {
                    return (
                      <TableItem
                        approved={false}
                        key={user._id}
                      >
                        <span>{user.fomoId || '-'}</span>
                        <span>{user.email}</span>
                        <span>{user.username}</span>
                        <div>
                        </div>
                        <ActionBtns>
                          <Button
                            onClick={() => confirmChangeRequestStatus('confirm', user._id)}
                            type={'bordered'}
                          >
                            Approve
                          </Button>
                          <Button
                            className="decline-btn"
                            onClick={() => confirmChangeRequestStatus('reject', user._id)}
                            type={'bordered'}
                          >
                            Reject
                          </Button>
                        </ActionBtns>
                      </TableItem>
                    )
                  })
                  :
                  <></>
              }
              {
                task?.awarded?.length
                  ?
                  task.awarded.map((user: any) => {
                    return (
                      <TableItem
                        approved={true}
                        key={user._id}
                      >
                        <span>{user.fomoId || '-'}</span>
                        <span>{user.email}</span>
                        <span>{user.username}</span>
                        <div>
                        </div>
                      </TableItem>
                    )
                  })
                  :
                  <>
                  </>
              }
            </TableList>
          </TableBody>
        </TableWrapper>
      </Wrapper>
      {
        loading
          ?
          <Loader />
          :
          <></>
      }
    </>
  )
}

export default TaskItemPage
