import React, { useState } from 'react';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { HStack } from '@/components/ui/hstack';
import { Divider } from '@/components/ui/divider';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('demo@example.com');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { redirect } = useLocalSearchParams();

    const handleLogin = async () => {
        try {
            setError('');
            await login(email, password);
            // Redirect to checkout if coming from cart page, otherwise go to home
            if (redirect === 'checkout') {
                router.replace('/checkout');
            } else {
                router.replace('/(tabs)');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
        }
    };

    return (
        <Box className="flex-1 bg-white p-4 justify-center">
            <VStack className="gap-4">
                <Heading className="text-2xl text-center">Amazon</Heading>
                <Text className="text-xl font-bold">Sign-In</Text>

                {error ? (
                    <Box className="bg-red-100 p-3 rounded-md">
                        <Text className="text-red-600">{error}</Text>
                    </Box>
                ) : null}

                <VStack className="gap-2">
                    <FormControl>
                        <FormControlLabel>
                            <FormControlLabelText>Email or mobile phone number</FormControlLabelText>
                        </FormControlLabel>
                        <Input>
                            <InputField
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </Input>
                    </FormControl>

                    <FormControl>
                        <FormControlLabel>
                            <FormControlLabelText>Password</FormControlLabelText>
                        </FormControlLabel>
                        <Input>
                            <InputField
                                value={password}
                                onChangeText={setPassword}
                                type="password"
                            />
                        </Input>
                    </FormControl>

                    <Button onPress={handleLogin} className="bg-yellow-400" size="lg">
                        <ButtonText className="text-black">Sign In</ButtonText>
                    </Button>
                </VStack>

                <HStack className="items-center gap-2">
                    <Divider className="flex-1" />
                    <Text className="text-gray-500 text-xs">New to Amazon?</Text>
                    <Divider className="flex-1" />
                </HStack>

                <Button
                    variant="outline"
                    className="border-gray-300"
                    onPress={() => router.push('/(auth)/register')}
                >
                    <ButtonText className="text-black">Create your Amazon account</ButtonText>
                </Button>
            </VStack>
        </Box>
    );
}
