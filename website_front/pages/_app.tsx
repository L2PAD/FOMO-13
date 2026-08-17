import React from "react";
import { AppProps } from "next/app";
import { ThemeProvider } from "react-jss";
import { ToastContainer } from "react-toastify";
import "../helpers/configureMoment";
import "../components/layouts/mainpage/css/main.scss";
import "../components/layouts/mainpage/css/about.scss";
import "../components/layouts/mainpage/css/core.scss";
import "../components/layouts/mainpage/css/evolution.scss";
import "../components/layouts/mainpage/css/skyscrappers-labels.scss";
import "../components/layouts/mainpage/css/planet-labels.scss";
import "../components/layouts/mainpage/css/mobile-milestones.scss";
import "../components/global/FAQandRisks/styles.css";
import "../styles/globals.css";
import "react-quill/dist/quill.snow.css";
import "react-toastify/dist/ReactToastify.css";
import CookieConsent from "../components/global/CookieModal";
import { wrapper } from "../store/store";
import { QueryClient, QueryClientProvider } from "react-query";
import { CartProvider } from "../contexts/CartContext";
import { I18nProvider } from "i18n";
import Web3Providers from "../providers/Web3Providers";
import {
  ModalDatePickerGlobalStyles,
} from "../components/global/common/components_for_modals/modal_date_picker/styles";

const queryClient = new QueryClient();

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <Web3Providers>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <CartProvider>
            <ThemeProvider theme={{}}>
              <ModalDatePickerGlobalStyles />
              <Component {...pageProps} />
              <ToastContainer
                autoClose={3000}
                position="top-right"
                pauseOnHover
                theme="colored"
                hideProgressBar
                limit={3}
                newestOnTop
                closeButton={false}
              />
              <CookieConsent />
            </ThemeProvider>
          </CartProvider>
        </I18nProvider>
      </QueryClientProvider>
    </Web3Providers>
  );
};

export default wrapper.withRedux(App);
