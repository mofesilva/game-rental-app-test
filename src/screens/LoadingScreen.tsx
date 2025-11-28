import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export function LoadingScreen() {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#facc15" />
            <Text style={styles.label}>Conectando ao Cappuccino…</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#020617",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    label: {
        color: "#cbd5f5",
        fontSize: 16,
    },
});
