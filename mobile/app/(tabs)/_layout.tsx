import { Tabs } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { Home, Layers, Menu, ShoppingCart, User } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';

export default function TabLayout() {
    const { itemCount } = useCart();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#ff6200',
                tabBarInactiveTintColor: '#000000', tabBarShowLabel: false
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ color }) => <Icon as={Home} color={color} size='xl' />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ color }) => <Icon as={User} color={color} size='xl' />,
                }}
            />
            <Tabs.Screen
                name="cart"
                options={{
                    tabBarIcon: ({ color }) => <Icon as={ShoppingCart} color={color} size='xl' />,
                    tabBarBadge: itemCount > 0 ? itemCount : undefined,
                }}
            />

            <Tabs.Screen
                name="categories"
                options={{
                    tabBarIcon: ({ color }) => <Icon as={Menu} color={color} size='xl' />,
                }}
            />

            <Tabs.Screen
                name="search"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="product/[id]"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
