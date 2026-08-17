import { QueryClient,QueryClientProvider} from "react-query";
import ReactDOM from 'react-dom/client'
import {store} from './store/store'
import {Provider} from 'react-redux'
import {App} from './components/app';
import { WalletProvider } from './components/wallet/WalletProvider';
import {ThemeProvider} from 'react-jss';
import {ThemeProvider as StyledProvider} from 'styled-components';
import './global_styles.css'

const queryClient = new QueryClient()

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
    <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={{}}>
        <StyledProvider theme={{}}>
            <Provider store={store}>
                <WalletProvider>
                    <App/>
                </WalletProvider>
            </Provider>
        </StyledProvider>
    </ThemeProvider>
    </QueryClientProvider>
)
