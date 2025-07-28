import '../styles/globals.css';
import { PrivyProvider } from '@privy-io/react-auth';

function MyApp({ Component, pageProps }) {
  return (
    <PrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID} config={{ loginMethods: ['google', 'email'], appearance: { theme: 'light' } }}>
      <Component {...pageProps} />
    </PrivyProvider>
  );
}

export default MyApp;