type PaymentMethod = 'card' | 'cod';

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface PaystackVerifyResponse {
  success: boolean;
  data: {
    status: 'success' | 'failed';
    reference: string;
  };
}

interface WebViewMessage {
  status: 'success' | 'cancelled';
  reference?: string;
}


import React, { useState, useEffect } from 'react';
import { ScrollView, Platform, Linking } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Divider } from '@/components/ui/divider';
import { Image } from '@/components/ui/image';
import { Input, InputField } from '@/components/ui/input';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Radio, RadioGroup, RadioIndicator, RadioIcon, RadioLabel } from '@/components/ui/radio';
import { CircleIcon } from '@/components/ui/icon';
import { Header } from '../components';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '@/services/api';
import { router } from 'expo-router';
import { showAlert } from '@/utils';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebaseConfig';
import { WebView } from 'react-native-webview';


const isWeb = Platform.OS === "web";

export default function CheckoutScreen() {
    const { items, totalAmount, clearCart } = useCart();
    const { user } = useAuth();

    const [address, setAddress] = useState<Address>({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Ghana'
    });
    
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
    const [loading, setLoading] = useState(false);
    const [showPaystack, setShowPaystack] = useState(false);
    const [paystackReference, setPaystackReference] = useState('');

    // Initialize address from user profile if available
    useEffect(() => {
        if (user?.shippingAddress) {
            setAddress(user.shippingAddress);
        }
    }, [user]);

    // Generate unique reference for Paystack
    const generateReference = () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `REF_${timestamp}_${random}`;
    };

    // Initialize Paystack payment
    const initializePaystackPayment = async () => {
        try {
            const reference = generateReference();
            setPaystackReference(reference);
            
            // For web platform, redirect to Paystack checkout
            if (isWeb) {
                const paystackData = {
                    key: process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY,
                    email: user?.email || 'customer@example.com',
                    amount: totalAmount * 100, // Convert to kobo (GH₵1 = 100 kobo)
                    currency: 'GHS',
                    ref: reference,
                    callback: (response) => {
                        handlePaymentVerification(response.reference);
                    },
                    onClose: () => {
                        showAlert('Payment was cancelled');
                    }
                };

                // Create form and submit for web
                const handler = window.PaystackPop.setup(paystackData);
                handler.openIframe();
            } else {
                // For mobile, show Paystack WebView
                setShowPaystack(true);
            }

        } catch (error) {
            console.error('Error initializing payment:', error);
            showAlert('Failed to initialize payment. Please try again.');
        }
    };

    // Verify payment with backend
    const handlePaymentVerification = async (reference: string) => {
        try {
            setLoading(true);
            
            const functions = getFunctions(app);
            const verifyPayment = httpsCallable(functions, 'verifyPaystackPayment');
            
            const response = await verifyPayment({ reference });
            const { success, data } = response.data as any;
            
            if (success && data.status === 'success') {
                await handleOrderCreation();
            } else {
                showAlert('Payment verification failed. Please try again.');
            }
        } catch (error) {
            console.error('Payment verification error:', error);
            showAlert('Error verifying payment. Please contact support.');
        } finally {
            setLoading(false);
        }
    };

    // Handle order creation
    const handleOrderCreation = async () => {
        if (!user) {
            showAlert('Please login to place an order');
            return;
        }

        try {
            const orderData = {
                userId: user.id,
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.product?.price || 0,
                    currency: 'GHS', // Add currency field
                    productName: item.product?.name || '',
                    productImage: item.product?.images[0] || ''
                })),
                totalAmount,
                currency: 'GHS', // Add currency to order
                shippingAddress: { 
                    ...address, 
                    id: Date.now().toString(),
                    country: address.country || 'Ghana' // Ensure Ghana as default
                },
                status: 'pending',
                statusHistory: [{ status: 'pending', date: new Date().toISOString() }],
                paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
                paymentMethod,
                paymentReference: paymentMethod === 'card' ? paystackReference : null,
                createdAt: new Date().toISOString(),
                orderNumber: `ORD-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
            };

            await orderAPI.create(orderData);
            await clearCart();

            showAlert('Success! Your order has been placed!');
            router.replace('/orders');
        } catch (error) {
            console.error('Error placing order:', error);
            showAlert('Error: Failed to place order. Please try again.');
        }
    };

    // Main order placement handler
    const handlePlaceOrder = async () => {
        if (!user) {
            showAlert('Please login to place an order');
            return;
        }

        setLoading(true);

        try {
            // Validate address
            if (!address.street || !address.city || !address.state || !address.zipCode) {
                showAlert('Please complete your shipping address');
                setLoading(false);
                return;
            }

            if (paymentMethod === 'cod') {
                await handleOrderCreation();
                setLoading(false);
                return;
            }

            if (paymentMethod === 'card') {
                if (totalAmount < 0.5) {
                    showAlert('Minimum payment amount is GH₵0.50');
                    setLoading(false);
                    return;
                }
                
                await initializePaystackPayment();
                setLoading(false);
                return;
            }
        } catch (error) {
            console.error('Error placing order:', error);
            showAlert('Error: Failed to place order. Please try again.');
            setLoading(false);
        }
    };

    return (
        <Box className="flex-1 bg-gray-100">
            <Header />
            <ScrollView>
                <VStack className="gap-2 p-4">
                    <Heading className="text-xl">Checkout</Heading>

                    {/* Shipping Address Section */}
                    <Box className="bg-white p-4 rounded-md">
                        <Heading className="text-md mb-2">1. Shipping Address</Heading>
                        <VStack className="gap-1">
                            <FormControl>
                                <FormControlLabel>
                                    <FormControlLabelText>Street Address</FormControlLabelText>
                                </FormControlLabel>
                                <Input>
                                    <InputField 
                                        value={address.street}
                                        onChangeText={t => setAddress({ ...address, street: t })}
                                        placeholder="Enter street address"
                                    />
                                </Input>
                            </FormControl>
                            <HStack className="gap-2">
                                <FormControl className="flex-1">
                                    <FormControlLabel>
                                        <FormControlLabelText>City</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input>
                                        <InputField 
                                            value={address.city}
                                            onChangeText={t => setAddress({ ...address, city: t })}
                                            placeholder="Enter city"
                                        />
                                    </Input>
                                </FormControl>
                                <FormControl className="flex-1">
                                    <FormControlLabel>
                                        <FormControlLabelText>State/Region</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input>
                                        <InputField 
                                            value={address.state}
                                            onChangeText={t => setAddress({ ...address, state: t })}
                                            placeholder="Enter state/region"
                                        />
                                    </Input>
                                </FormControl>
                            </HStack>
                            <HStack className="gap-2">
                                <FormControl className="flex-1">
                                    <FormControlLabel>
                                        <FormControlLabelText>Zip/Postal Code</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input>
                                        <InputField 
                                            value={address.zipCode}
                                            onChangeText={t => setAddress({ ...address, zipCode: t })}
                                            placeholder="Enter postal code"
                                            keyboardType="numeric"
                                        />
                                    </Input>
                                </FormControl>
                                <FormControl className="flex-1">
                                    <FormControlLabel>
                                        <FormControlLabelText>Country</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input>
                                        <InputField 
                                            value={address.country}
                                            onChangeText={t => setAddress({ ...address, country: t })}
                                            placeholder="Enter country"
                                        />
                                    </Input>
                                </FormControl>
                            </HStack>
                        </VStack>
                    </Box>

                    {/* Payment Method Section */}
                    <Box className="bg-white p-4 rounded-md">
                        <Heading className="text-md mb-2">2. Payment Method</Heading>
                        <RadioGroup value={paymentMethod} onChange={setPaymentMethod}>
                            <VStack className="gap-1">
                                <Radio value="card">
                                    <RadioIndicator className="mr-2">
                                        <RadioIcon as={CircleIcon} />
                                    </RadioIndicator>
                                    <RadioLabel>Credit/Debit Card (Paystack)</RadioLabel>
                                </Radio>
                                <Radio value="cod">
                                    <RadioIndicator className="mr-2">
                                        <RadioIcon as={CircleIcon} />
                                    </RadioIndicator>
                                    <RadioLabel>Cash on Delivery</RadioLabel>
                                </Radio>
                            </VStack>
                        </RadioGroup>
                    </Box>

                    {/* Order Summary Section */}
                    <Box className="bg-white p-4 rounded-md">
                        <Heading className="text-md mb-2">3. Order Summary</Heading>

                        {/* Cart Items List */}
                        <VStack className="gap-2 mb-3">
                            {items.map((item) => (
                                <HStack key={item.productId} className="gap-3 pb-2 border-b border-gray-200">
                                    <Image
                                        source={{ uri: item.product?.images[0] }}
                                        alt={item.product?.name}
                                        className="w-16 h-16 rounded-md"
                                        resizeMode="cover"
                                    />
                                    <VStack className="flex-1 gap-1">
                                        <Text className="text-sm font-medium" numberOfLines={2}>
                                            {item.product?.name}
                                        </Text>
                                        <HStack className="justify-between items-center">
                                            <Text className="text-xs text-gray-600">Qty: {item.quantity}</Text>
                                            <Text className="text-sm font-semibold">
                                                GH₵{((item.product?.price || 0) * item.quantity).toFixed(2)}
                                            </Text>
                                        </HStack>
                                    </VStack>
                                </HStack>
                            ))}
                        </VStack>

                        <VStack className="gap-1">
                            <HStack className="justify-between">
                                <Text>Items:</Text>
                                <Text>GH₵{totalAmount.toFixed(2)}</Text>
                            </HStack>
                            <HStack className="justify-between">
                                <Text>Shipping:</Text>
                                <Text className="text-green-600">FREE</Text>
                            </HStack>
                            <Divider className="my-2" />
                            <HStack className="justify-between">
                                <Heading className="text-md text-red-600">Order Total:</Heading>
                                <Heading className="text-md text-red-600">GH₵{totalAmount.toFixed(2)}</Heading>
                            </HStack>
                        </VStack>
                    </Box>

                    {/* Place Order Button */}
                    <Box className="bg-white p-4 rounded-md">
                        <Button
                            className="mt-4 bg-yellow-400"
                            onPress={handlePlaceOrder}
                            isDisabled={loading || items.length === 0}
                        >
                            {loading ? (
                                <ButtonText className="text-black">Processing...</ButtonText>
                            ) : (
                                <ButtonText className="text-black">
                                    Place Your Order - GH₵{totalAmount.toFixed(2)}
                                </ButtonText>
                            )}
                        </Button>
                        
                        {paymentMethod === 'card' && (
                            <Text className="text-xs text-gray-500 mt-2 text-center">
                                Secure payment powered by Paystack
                            </Text>
                        )}
                    </Box>
                </VStack>
            </ScrollView>

            {/* Paystack WebView for Mobile */}
           {/* Paystack Inline WebView (Expo Safe) */}
{!isWeb && showPaystack && (
    <WebView
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        source={{
            html: `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://js.paystack.co/v1/inline.js"></script>
  </head>
  <body>
    <script>
      PaystackPop.setup({
        key: "${process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY}",
        email: "${user?.email || 'customer@example.com'}",
        amount: ${Math.round(totalAmount * 100)},
        currency: "GHS",
        ref: "${paystackReference}",
        callback: function(response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            status: "success",
            reference: response.reference
          }));
        },
        onClose: function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            status: "cancelled"
          }));
        }
      }).openIframe();
    </script>
  </body>
</html>
            `,
        }}
        onMessage={(event) => {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.status === "success") {
                setShowPaystack(false);
                handlePaymentVerification(data.reference);
            } else {
                setShowPaystack(false);
                showAlert("Payment was cancelled");
            }
        }}
        style={{ flex: 1 }}
    />
)}
        </Box>
    );
}
