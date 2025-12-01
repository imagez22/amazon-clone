import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Product } from '../types';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CART_STORAGE_KEY = '@cart_items';

interface CartContextType {
    items: CartItem[];
    totalAmount: number;
    itemCount: number;
    addToCart: (product: Product, quantity?: number) => Promise<void>;
    removeFromCart: (productId: string) => Promise<void>;
    updateQuantity: (productId: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [cartId, setCartId] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchCart();
        } else {
            loadLocalCart();
            setCartId(null);
        }
    }, [user]);

    // Load cart from AsyncStorage for unauthenticated users
    const loadLocalCart = async () => {
        try {
            const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
            if (storedCart) {
                const parsedCart = JSON.parse(storedCart);
                setItems(parsedCart);
            } else {
                setItems([]);
            }
        } catch (error) {
            console.error('Error loading local cart:', error);
            setItems([]);
        }
    };

    // Save cart to AsyncStorage for unauthenticated users
    const saveLocalCart = async (cartItems: CartItem[]) => {
        try {
            await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
        } catch (error) {
            console.error('Error saving local cart:', error);
        }
    };

    // Sync local cart to backend after login
    const syncLocalCartToBackend = async (backendCartId: string) => {
        try {
            const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
            if (storedCart) {
                const localItems: CartItem[] = JSON.parse(storedCart);
                if (localItems.length > 0) {
                    // Sync local items to backend
                    const totalAmount = localItems.reduce((sum, item) => {
                        return sum + (item.product?.price || 0) * item.quantity;
                    }, 0);

                    await cartAPI.updateCart(backendCartId, { items: localItems, totalAmount });
                    setItems(localItems);

                    // Clear local storage after successful sync
                    await AsyncStorage.removeItem(CART_STORAGE_KEY);
                }
            }
        } catch (error) {
            console.error('Error syncing local cart to backend:', error);
        }
    };

    const fetchCart = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await cartAPI.getCart(user.id);
            const carts = response.data;
            if (carts.length > 0) {
                const cart = carts[0];
                // If backend cart is empty, sync local cart
                if (cart.items.length === 0) {
                    setCartId(cart.id);
                    await syncLocalCartToBackend(cart.id);
                } else {
                    // Backend cart has items, use it and discard local cart
                    setItems(cart.items);
                    setCartId(cart.id);
                    await AsyncStorage.removeItem(CART_STORAGE_KEY);
                }
            } else {
                // Create a new cart for the user
                const newCart = { userId: user.id, items: [], totalAmount: 0 };
                const createResponse = await cartAPI.addToCart(newCart);
                setCartId(createResponse.data.id);
                await syncLocalCartToBackend(createResponse.data.id);
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const syncCart = async (newItems: CartItem[]) => {
        if (!user) {
            // Save to local storage for unauthenticated users
            await saveLocalCart(newItems);
            return;
        }

        if (!cartId) return;

        const totalAmount = newItems.reduce((sum, item) => {
            return sum + (item.product?.price || 0) * item.quantity;
        }, 0);

        try {
            await cartAPI.updateCart(cartId, { items: newItems, totalAmount });
        } catch (error) {
            console.error('Error syncing cart:', error);
        }
    };

    const addToCart = async (product: Product, quantity = 1) => {
        const existingItemIndex = items.findIndex(item => item.productId === product.id);
        let newItems = [...items];

        if (existingItemIndex >= 0) {
            newItems[existingItemIndex].quantity += quantity;
        } else {
            newItems.push({ productId: product.id, quantity, product });
        }

        setItems(newItems);
        await syncCart(newItems);
    };

    const removeFromCart = async (productId: string) => {
        const newItems = items.filter(item => item.productId !== productId);
        setItems(newItems);
        await syncCart(newItems);
    };

    const updateQuantity = async (productId: string, quantity: number) => {
        if (quantity <= 0) {
            await removeFromCart(productId);
            return;
        }

        const newItems = items.map(item =>
            item.productId === productId ? { ...item, quantity } : item
        );
        setItems(newItems);
        await syncCart(newItems);
    };

    const clearCart = async () => {
        setItems([]);
        await syncCart([]);
    };

    const totalAmount = items.reduce((sum, item) => {
        return sum + (item.product?.price || 0) * item.quantity;
    }, 0);

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            items,
            totalAmount,
            itemCount,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            isLoading
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
