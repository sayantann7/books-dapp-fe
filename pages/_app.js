import '../styles/globals.css';
import { Web3AuthProvider } from '../components/Web3AuthProvider';

function MyApp({ Component, pageProps }) {
  return (
    <Web3AuthProvider>
      <Component {...pageProps} />
    </Web3AuthProvider>
  );
}

export default MyApp;