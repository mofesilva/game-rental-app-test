import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export function UsersScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Usuários</Text>
                <Text style={styles.subtitle}>Gestão de usuários e permissões ficará disponível em breve.</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#020617",
    },
    container: {
        flex: 1,
        padding: 24,
        gap: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#f8fafc",
    },
    subtitle: {
        color: "#94a3b8",
        fontSize: 16,
    },
});