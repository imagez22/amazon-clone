import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Spinner } from "@/components/ui/spinner";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText } from "@/components/ui/button";
import { useLocalSearchParams } from 'expo-router';
import { Header, ProductCard } from '../../components';
import { productAPI } from '../../services/api';
import { Product, ProductFilter } from '../../types';

export default function SearchScreen() {
    const { q, categoryId } = useLocalSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState<ProductFilter['sortOrder']>();
    const [isDeal, setIsDeal] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const filter: ProductFilter = {};
                if (categoryId) filter.categoryId = categoryId as string;
                if (q) filter.query = (q as string);
                if (sortOrder) filter.sortOrder = sortOrder;
                if (isDeal) filter.isDeal = true;

                const response = await productAPI.getByFilter(filter);
                setProducts(response.data);
            } catch (error) {
                console.error('Error searching products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [q, categoryId, sortOrder, isDeal]);

    return (
        <Box className="flex-1 bg-gray-100">
            <Header />
            <ScrollView>
                <Box className="p-4">
                    <Heading className="text-xl mb-4">
                        {q ? `Search results for "${q}"` : categoryId ? 'Category Results' : 'All Products'}
                    </Heading>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                        <Button
                            size="sm"
                            variant={sortOrder === 'price_asc' ? 'solid' : 'outline'}
                            action="primary"
                            onPress={() => setSortOrder(sortOrder === 'price_asc' ? undefined : 'price_asc')}
                            className="mr-2"
                        >
                            <ButtonText>Lowest Price</ButtonText>
                        </Button>
                        <Button
                            size="sm"
                            variant={sortOrder === 'rating_desc' ? 'solid' : 'outline'}
                            action="primary"
                            onPress={() => setSortOrder(sortOrder === 'rating_desc' ? undefined : 'rating_desc')}
                            className="mr-2"
                        >
                            <ButtonText>Highest Rating</ButtonText>
                        </Button>
                        <Button
                            size="sm"
                            variant={sortOrder === 'newest' ? 'solid' : 'outline'}
                            action="primary"
                            onPress={() => setSortOrder(sortOrder === 'newest' ? undefined : 'newest')}
                            className="mr-2"
                        >
                            <ButtonText>Newest</ButtonText>
                        </Button>
                        <Button
                            size="sm"
                            variant={isDeal ? 'solid' : 'outline'}
                            action="primary"
                            onPress={() => setIsDeal(!isDeal)}
                            className="mr-2"
                        >
                            <ButtonText>Deals</ButtonText>
                        </Button>
                    </ScrollView>

                    {loading ? (
                        <Box className="flex-1 justify-center items-center py-10">
                            <Spinner size="large" className="text-primary-500" />
                        </Box>
                    ) : products.length > 0 ? (
                        <Box className="flex-row flex-wrap">
                            {products.map(product => (
                                <Box key={product.id} className="w-1/2">
                                    <ProductCard product={product} />
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        <Box className="flex-1 justify-center items-center py-10">
                            <Text className="text-gray-500">No products found.</Text>
                        </Box>
                    )}
                </Box>
            </ScrollView>
        </Box>
    );
}
