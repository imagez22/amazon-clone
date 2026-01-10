import { WebView } from 'react-native-webview';

const usePaystack = () => ({
    initPaymentSheet: async () => ({ error: null }),
    presentPaymentSheet: async () => ({ error: null }),
    confirmCardPayment: async () => ({ error: null, paymentIntent: { status: 'succeeded' } }),
});

const PaystackProvider = ({ children, publishableKey }: { children: React.ReactNode; publishableKey: string }) => <>{children}</>;

export { usePaystack, PaystackProvider, WebView };