import { Feather } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ClientsScreen } from "@/screens/ClientsScreen";
import { DashboardScreen } from "@/screens/DashboardScreen";
import { GamesScreen } from "@/screens/GamesScreen";
import { RentalsScreen } from "@/screens/RentalsScreen";
import { UsersScreen } from "@/screens/UsersScreen";

export type AppTabParamList = {
    Dashboard: undefined;
    Games: undefined;
    Rentals: undefined;
    Clients: undefined;
    Users: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

const icons: Record<keyof AppTabParamList, keyof typeof Feather.glyphMap> = {
    Dashboard: "home",
    Games: "layers",
    Rentals: "repeat",
    Clients: "users",
    Users: "shield",
};

export function AuthenticatedTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <TabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Games" component={GamesScreen} />
            <Tab.Screen name="Rentals" component={RentalsScreen} />
            <Tab.Screen name="Clients" component={ClientsScreen} />
            <Tab.Screen name="Users" component={UsersScreen} />
        </Tab.Navigator>
    );
}

function TabBar({ state, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    return (
        <View style={[styles.tabBar, { paddingBottom: 12 + insets.bottom }]}>
            {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const onPress = () => {
                    const event = navigation.emit({
                        type: "tabPress",
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: "tabLongPress",
                        target: route.key,
                    });
                };

                const Icon = Feather;
                const iconName = icons[route.name as keyof AppTabParamList];

                return (
                    <Pressable
                        key={route.key}
                        style={styles.tabItem}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : undefined}
                        accessibilityLabel={route.name}
                    >
                        <Icon name={iconName} size={22} color={isFocused ? "#38bdf8" : "#64748b"} />
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: "row",
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 24,
        justifyContent: "space-around",
        backgroundColor: "#0f172a",
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "#1e293b",
    },
    tabItem: {
        flex: 1,
        alignItems: "center",
    },
});
