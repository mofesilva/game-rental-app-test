import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import type { DBUser } from "@cappuccino/web-sdk";

import { getCappuccinoClient } from "@/lib/cappuccino/client";

const INITIAL_FORM = {
    name: "",
    email: "",
    login: "",
    password: "",
    role_id: "admin",
};

export function UsersScreen() {
    const client = useMemo(() => getCappuccinoClient(), []);
    const [users, setUsers] = useState<DBUser[]>([]);
    const [form, setForm] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchUsers = useCallback(async () => {
        setRefreshing(true);
        const snapshot = await client.modules.dbusers.find();
        if (snapshot.error) {
            Alert.alert("Erro", snapshot.errorMsg ?? "Não foi possível carregar os usuários.");
        } else {
            setUsers(snapshot.documents ?? []);
        }
        setLoading(false);
        setRefreshing(false);
    }, [client]);

    useEffect(() => {
        void fetchUsers();
    }, [fetchUsers]);

    function handleChange(field: keyof typeof INITIAL_FORM, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleCreate() {
        if (!form.name.trim() || !form.email.trim() || !form.login.trim() || !form.password.trim()) {
            Alert.alert("Campos obrigatórios", "Preencha nome, e-mail, login e senha.");
            return;
        }

        setSubmitting(true);
        const payload = {
            name: form.name.trim(),
            email: form.email.trim(),
            login: form.login.trim(),
            password: form.password.trim(),
            role_id: form.role_id.trim() || "admin",
        };

        const snapshot = await client.modules.dbusers.create(payload);
        setSubmitting(false);
        if (snapshot.error) {
            Alert.alert("Erro", snapshot.errorMsg ?? "Não foi possível criar o usuário.");
            return;
        }

        if (snapshot.document) {
            setUsers((prev) => [snapshot.document as DBUser, ...prev]);
        }
        setForm((prev) => ({ ...INITIAL_FORM, role_id: prev.role_id }));
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchUsers} />}
            >
                <Text style={styles.title}>Usuários</Text>
                <Text style={styles.subtitle}>Gerencie a equipe com acesso ao painel mobile.</Text>

                <View style={styles.cardRow}>
                    <View style={styles.formCard}>
                        <Text style={styles.cardTitle}>Cadastrar usuário</Text>
                        <LabeledInput
                            label="Nome"
                            autoCapitalize="words"
                            value={form.name}
                            onChangeText={(value) => handleChange("name", value)}
                        />
                        <LabeledInput
                            label="E-mail"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={form.email}
                            onChangeText={(value) => handleChange("email", value)}
                        />
                        <LabeledInput
                            label="Login"
                            autoCapitalize="none"
                            value={form.login}
                            onChangeText={(value) => handleChange("login", value)}
                        />
                        <LabeledInput
                            label="Senha inicial"
                            secureTextEntry
                            autoCapitalize="none"
                            value={form.password}
                            onChangeText={(value) => handleChange("password", value)}
                        />
                        <LabeledInput
                            label="Papel (role)"
                            autoCapitalize="none"
                            value={form.role_id}
                            onChangeText={(value) => handleChange("role_id", value)}
                        />
                        <Pressable
                            style={[styles.primaryButton, submitting && styles.disabledButton]}
                            onPress={handleCreate}
                            disabled={submitting}
                        >
                            <Text style={styles.primaryButtonText}>
                                {submitting ? "Salvando…" : "Salvar usuário"}
                            </Text>
                        </Pressable>
                    </View>

                    <View style={styles.listCard}>
                        <View style={styles.listHeader}>
                            <Text style={styles.cardTitle}>Equipe ativa</Text>
                            <Text style={styles.countLabel}>{users.length} usuário(s)</Text>
                        </View>
                        {loading ? (
                            <ActivityIndicator color="#38bdf8" />
                        ) : users.length ? (
                            <View style={styles.listContent}>
                                {users.map((user) => (
                                    <View key={user._id} style={styles.listItem}>
                                        <Text style={styles.itemTitle}>{user.name || user.login}</Text>
                                        <Text style={styles.itemSubtitle}>{user.email || "Sem e-mail"}</Text>
                                        <Text style={styles.itemMeta}>{user.role_id}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.emptyText}>Nenhum usuário cadastrado.</Text>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function LabeledInput({
    label,
    value,
    onChangeText,
    keyboardType,
    autoCapitalize,
    secureTextEntry,
}: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    keyboardType?: "default" | "email-address";
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
    secureTextEntry?: boolean;
}) {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                secureTextEntry={secureTextEntry}
                placeholderTextColor="#64748b"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#020617",
    },
    scroll: {
        flex: 1,
    },
    content: {
        padding: 24,
        gap: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#f8fafc",
    },
    subtitle: {
        color: "#94a3b8",
        fontSize: 15,
    },
    cardRow: {
        gap: 16,
    },
    formCard: {
        backgroundColor: "#0f172a",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#1e293b",
        gap: 12,
    },
    listCard: {
        backgroundColor: "#0f172a",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#1e293b",
        gap: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#f8fafc",
    },
    listHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    countLabel: {
        color: "#94a3b8",
        fontSize: 13,
    },
    listContent: {
        gap: 12,
    },
    listItem: {
        borderWidth: 1,
        borderColor: "#1e293b",
        borderRadius: 12,
        padding: 12,
        backgroundColor: "#020617",
        gap: 4,
    },
    itemTitle: {
        color: "#f8fafc",
        fontWeight: "600",
    },
    itemSubtitle: {
        color: "#94a3b8",
        fontSize: 13,
    },
    itemMeta: {
        color: "#64748b",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 2,
    },
    emptyText: {
        color: "#64748b",
        fontSize: 14,
    },
    primaryButton: {
        backgroundColor: "#6366f1",
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
    },
    disabledButton: {
        opacity: 0.6,
    },
    primaryButtonText: {
        color: "#f8fafc",
        fontWeight: "600",
    },
    inputGroup: {
        gap: 6,
    },
    inputLabel: {
        color: "#94a3b8",
        fontSize: 14,
    },
    input: {
        borderWidth: 1,
        borderColor: "#1e293b",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        color: "#f1f5f9",
        backgroundColor: "#020617",
    },
});