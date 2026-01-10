// Paystack for web - using inline payment
import { WebView } from 'react-native-webview';

const mockPaystack = {
    initPaymentSheet: async () => ({ error: null }),
    presentPaymentSheet: async () => ({ error: null }),
    confirmCardPayment: async () => ({ error: null, paymentIntent: { status: 'succeeded' } }),
};

const usePaystack = () => mockPaystack;
const useElements = () => null;
const CardElement = () => null;

const PaystackProvider = ({ children }: any) => <>{children}</>;

export { usePaystack, useElements, CardElement, PaystackProvider , WebView };