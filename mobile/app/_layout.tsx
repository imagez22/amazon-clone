import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import '@/global.css'
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, CartProvider, WishlistProvider } from "../context";

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <GluestackUIProvider mode="light">
                <AuthProvider>
                    <CartProvider>
                        <WishlistProvider>
                            <Stack  >
                                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                                <Stack.Screen name="(auth)/login" options={{ headerShown: true, title: "Login" }} />
                                <Stack.Screen name="(auth)/register" options={{ headerShown: true, title: "Register" }} />
                                <Stack.Screen name="index" options={{ headerShown: false }} />
                                <Stack.Screen name="product/[id]" options={{ headerShown: false }} />

                            </Stack>
                        </WishlistProvider>
                    </CartProvider>
                </AuthProvider>
            </GluestackUIProvider>
        </SafeAreaProvider>
    );
}
