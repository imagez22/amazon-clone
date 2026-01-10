import React from 'react';
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Button, ButtonText } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { Icon } from "@/components/ui/icon";
import { Minus, Plus, Trash } from 'lucide-react-native';
import { CartItem as CartItemType } from '../types';
import { useCart } from '../context/CartContext';

interface CartItemProps {
    item: CartItemType;
}

export const CartItem = ({ item }: CartItemProps) => {
    const { updateQuantity, removeFromCart } = useCart();
    const { product, quantity } = item;

    if (!product) return null;

    return (
        <Box className="bg-white p-4 mb-2 rounded-md">
            <HStack className="gap-4">
                <Image
                    source={{ uri: product.images[0] }}
                    alt={product.name}
                    className="h-20 w-20 rounded-sm"
                    resizeMode="contain"
                />

                <VStack className="flex-1 justify-between">
                    <VStack>
                        <Text numberOfLines={2} className="text-sm font-medium">{product.name}</Text>
                        <Text className="font-bold text-md mt-1">₵{product.price}</Text>
                        {product.inStock ? (
                            <Text className="text-xs text-green-600">In Stock</Text>
                        ) : (
                            <Text className="text-xs text-red-600">Out of Stock</Text>
                        )}
                    </VStack>

                    <HStack className="justify-between items-center mt-2">
                        <HStack className="items-center bg-gray-100 rounded-md">
                            <Pressable
                                className={`p-2 ${quantity <= 1 ? 'opacity-50' : ''}`}
                                onPress={() => updateQuantity(product.id, quantity - 1)}
                                disabled={quantity <= 1}
                            >
                                <Icon as={Minus} className="w-4 h-4" />
                            </Pressable>
                            <Text className="px-2 font-medium">{quantity}</Text>
                            <Pressable
                                className="p-2"
                                onPress={() => updateQuantity(product.id, quantity + 1)}
                            >
                                <Icon as={Plus} className="w-4 h-4" />
                            </Pressable>
                        </HStack>

                        <Button
                            variant="link"
                            size="sm"
                            onPress={() => removeFromCart(product.id)}
                        >
                            <ButtonText className="text-red-500">Delete</ButtonText>
                        </Button>
                    </HStack>
                </VStack>
            </HStack>
        </Box>
    );
};
