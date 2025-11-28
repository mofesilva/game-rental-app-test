import { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@cappuccino/web-sdk";

export function LoginScreen() {
    const { signIn } = useAuth();
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        if (!login || !password) {
            Alert.alert("Credenciais obrigatórias", "Informe e-mail e senha para continuar.");
            return;
        }

        try {
            setLoading(true);
            await signIn({ login, password });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro ao fazer login";
            Alert.alert("Falha no login", message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Game Rental</Text>
                    <Text style={styles.subtitle}>Entre para acessar o painel mobile.</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>E-mail</Text>
                    <TextInput
                        style={styles.input}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholder="usuario@cappuccino.dev"
                        placeholderTextColor="#94a3b8"
                        value={login}
                        onChangeText={setLogin}
                    />

                    <Text style={styles.label}>Senha</Text>
                    <TextInput
                        style={styles.input}
                        secureTextEntry
                        placeholder="********"
                        placeholderTextColor="#94a3b8"
                        value={password}
                        onChangeText={setPassword}
                    />

                    <Button
                        title={loading ? "Entrando…" : "Entrar"}
                        onPress={handleSubmit}
                        disabled={loading}
                    />
                </View>
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
        backgroundColor: "#020617",
        padding: 24,
        gap: 32,
    },
    header: {
        marginTop: 32,
        gap: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#f8fafc",
    },
    subtitle: {
        fontSize: 16,
        color: "#cbd5f5",
    },
    form: {
        gap: 16,
    },
    label: {
        color: "#94a3b8",
        fontSize: 14,
    },
    input: {
        borderWidth: 1,
        borderColor: "#1e293b",
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: "#f1f5f9",
        fontSize: 16,
        backgroundColor: "#0f172a",
    },
});
