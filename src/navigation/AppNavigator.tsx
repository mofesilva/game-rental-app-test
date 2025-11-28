import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@cappuccino/web-sdk";

import { AuthenticatedTabs } from "@/navigation/AuthenticatedTabs";
import { LoadingScreen } from "@/screens/LoadingScreen";
import { LoginScreen } from "@/screens/LoginScreen";

export type RootStackParamList = {
    Login: undefined;
    Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
    const { initializing, user } = useAuth();

    if (initializing) {
        return <LoadingScreen />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: "fade",
                    contentStyle: { backgroundColor: "#020617" },
                }}
            >
                {user ? (
                    <Stack.Screen name="Main" component={AuthenticatedTabs} />
                ) : (
                    <Stack.Screen name="Login" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
