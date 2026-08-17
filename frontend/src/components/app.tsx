import {useEffect,useState} from 'react'
import { useDispatch,useSelector } from 'react-redux';
import { setAuth , setRole} from '../store/slices/authSlice';
import { RootState } from '../store/store';
import { checkAuth } from './services/auth/checkAuth';
import {
    BrowserRouter as Router,
    Route,
    Switch,
} from 'react-router-dom';
import {Redirect} from 'react-router';
import ProjectsPage from '../pages/Projects';
import EarlylandPages from '../pages/Earlyland';
import AccessMonetizationPage from '../pages/AccessMonetization';
import AcquiringPage from '../pages/Acquiring';
import NFTSPages from '../pages/NFTS';
import NotFoundPage from '../pages/NotFound';
import UsersList from '../pages/UsersList';
import Customer360 from '../pages/UsersList/Customer360';
import Statistics from '../pages/Statistics';
import Settings from '../pages/Settings';
import ContentPage from '../pages/Content';
import Advertising from '../pages/Advertising';
import FomoAiPage from '../pages/FomoAi';
import SpaceportPage from '../pages/Spaceport';
import BuzzPage from '../pages/Buzz';
import Person from '../pages/Person';
import LoginPage from '../pages/Login';
import ModeratorPage from '../pages/Settings/moderator';
import InfoPage from '../pages/Info';
import Support from '../pages/Support';
import Loader from './common/loader';
import TabsPage from '../pages/Tabs';
import FomoV2ReviewCasesPage from '../pages/Projects/FomoV2ReviewCases';
import FomoV2VestingReviewPage from '../pages/Projects/FomoV2VestingReview';
import AdminAiChatPage from '../pages/AdminAiChat';
import AdminDataSyncPage from '../pages/AdminDataSync';
import LaunchpadAdminPage from '../pages/Launchpad';
import AdminRatingPage from '../pages/AdminRating';
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from 'react-toastify';
import { AdminWalletGate } from './wallet/AdminWalletGate';

export const App = () => {
    const [loading,setLoading] = useState(true)
    const isAuth = useSelector((state : RootState) => state.auth.isAuth)
    const dispatch = useDispatch()

    useEffect(() => {
        checkAuth().then(({success}) => {
            if(!success){
                setLoading(false)
            }else{
                dispatch(setAuth(success))
                dispatch(setRole(localStorage.getItem('fomoRole')))
                setLoading(false)
            }
        })
    },[])
    
    if(loading){
        return (
            <Loader/>
        )
    }

    return (
        isAuth
        ?
        <Router basename='/admin'>
            <AdminWalletGate>
            <Switch>
                <Route exact path='/'>
                    <Redirect to='/projects' />
                </Route>
                <Route path='/projects' component={ProjectsPage} />
                <Route path='/fomo-v2/review-cases' component={FomoV2ReviewCasesPage} />
                <Route path='/fomo-v2/vesting-review' component={FomoV2VestingReviewPage} />
                <Route path='/fomo-v2/launchpad' component={LaunchpadAdminPage} />
                <Route path='/early_land' component={EarlylandPages} />
                <Route path='/access-monetization' component={AccessMonetizationPage} />
                <Route path='/fomo-ai' component={FomoAiPage} />
                <Route path='/spaceport' component={SpaceportPage} />
                <Route path='/buzz/:section' component={BuzzPage} />
                <Route path='/buzz' component={BuzzPage} />
                <Route path='/acquiring' component={AcquiringPage} />
                <Route path='/nfts' component={NFTSPages} />
                <Route path='/users_list/user/:id' component={Customer360} />
                <Route path='/users_list' component={UsersList} />
                <Route path='/statistics' component={Statistics} />
                <Route path='/settings/:id' component={ModeratorPage} />
                <Route path='/settings' component={Settings} />
                <Route path='/content/:section' component={ContentPage} />
                <Route path='/content' component={ContentPage} />
                <Route path='/advertising' component={Advertising} />
                <Route path='/person' component={Person} />
                <Route path='/login' component={LoginPage}/>
                <Route path='/ai-chat' component={AdminAiChatPage}/>
                <Route path='/data-sync' component={AdminDataSyncPage}/>
                <Route
                    path='/ratings'
                    render={() => (
                        String(localStorage.getItem('fomoRole') || '').trim().toLowerCase() === 'admin'
                            ? <AdminRatingPage/>
                            : <Redirect to='/projects'/>
                    )}
                />
                <Route path='/support' component={Support}/>
                <Route
                    path='/info'
                    render={() => (
                        String(localStorage.getItem('fomoRole') || '').trim().toLowerCase() === 'admin'
                            ? <InfoPage/>
                            : <Redirect to='/projects'/>
                    )}
                />
                <Route path='/tabs' component={TabsPage}/>
                <Route path="*" component={NotFoundPage} />
            </Switch>
            <ToastContainer/>
            </AdminWalletGate>
        </Router>
        :
        <>
        <Router basename='/admin'>
                <Route exact path='*'  >
                    <Redirect to='/login' />
                </Route>
                <Route path='/login' component={LoginPage}/>
        </Router>
        </>
    )
}
