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

import { getClientsCollection } from "@/lib/cappuccino/collections";
import type { ClientRecord } from "@/lib/types/client";
import { resolveDocumentId } from "@/lib/utils/documents";

const INITIAL_FORM = {
    name: "",
    email: "",
    phone: "",
    document_id: "",
};

export function ClientsScreen() {
    const collection = useMemo(() => getClientsCollection(), []);
    const [clients, setClients] = useState<ClientRecord[]>([]);
    const [form, setForm] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchClients = useCallback(async () => {
        setRefreshing(true);
        const snapshot = await collection.find();
        if (snapshot.error) {
            Alert.alert("Erro", snapshot.errorMsg ?? "Não foi possível carregar os clientes.");
        }
        setClients(snapshot.documents ?? []);
        setLoading(false);
        setRefreshing(false);
    }, [collection]);

    useEffect(() => {
        void fetchClients();
    }, [fetchClients]);

    function handleChange(field: keyof typeof INITIAL_FORM, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleCreate() {
        if (!form.name.trim()) {
            Alert.alert("Nome obrigatório", "Informe pelo menos o nome do cliente.");
            return;
        }
        setSubmitting(true);
        const payload: Partial<ClientRecord> = {
            name: form.name.trim(),
            email: form.email.trim() || undefined,
            phone: form.phone.trim() || undefined,
            document_id: form.document_id.trim() || undefined,
            created_at: new Date().toISOString(),
        };

        const snapshot = await collection.insertOne(payload as ClientRecord);
        setSubmitting(false);
        if (snapshot.error) {
            Alert.alert("Erro", snapshot.errorMsg ?? "Não foi possível salvar o cliente.");
            return;
        }

        const insertedId = resolveDocumentId(snapshot.document);
        const document: ClientRecord = {
            _id: insertedId ?? crypto.randomUUID(),
            ...payload,
            ...(snapshot.document ?? {}),
        } as ClientRecord;

        setClients((prev) => [document, ...prev]);
        setForm(INITIAL_FORM);
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchClients} />}
            >
                <Text style={styles.title}>Clientes</Text>
                <Text style={styles.subtitle}>Cadastre contatos que serão vinculados aos aluguéis.</Text>

                <View style={styles.cardRow}>
                    <View style={styles.formCard}>
                        <Text style={styles.cardTitle}>Novo cliente</Text>
                        <LabeledInput
                            label="Nome"
                            value={form.name}
                            onChangeText={(value) => handleChange("name", value)}
                        />
                        <LabeledInput
                            label="E-mail"
                            keyboardType="email-address"
                            value={form.email}
                            onChangeText={(value) => handleChange("email", value)}
                        />
                        <LabeledInput
                            label="Telefone"
                            keyboardType="phone-pad"
                            value={form.phone}
                            onChangeText={(value) => handleChange("phone", value)}
                        />
                        <LabeledInput
                            label="Documento"
                            value={form.document_id}
                            onChangeText={(value) => handleChange("document_id", value)}
                        />
                        <Pressable
                            style={[styles.primaryButton, submitting && styles.disabledButton]}
                            onPress={handleCreate}
                            disabled={submitting}
                        >
                            <Text style={styles.primaryButtonText}>
                                {submitting ? "Salvando…" : "Salvar cliente"}
                            </Text>
                        </Pressable>
                    </View>
                    <View style={styles.listCard}>
                        <View style={styles.listHeader}>
                            <Text style={styles.cardTitle}>Lista</Text>
                            <Text style={styles.countLabel}>{clients.length} cadastro(s)</Text>
                        </View>
                        {loading ? (
                            <ActivityIndicator color="#38bdf8" />
                        ) : clients.length ? (
                            <View style={styles.listContent}>
                                {clients.map((client) => (
                                    <View key={client._id ?? client.name} style={styles.listItem}>
                                        <Text style={styles.itemTitle}>{client.name}</Text>
                                        <Text style={styles.itemSubtitle}>{client.email || "E-mail não informado"}</Text>
                                        <Text style={styles.itemMeta}>
                                            {client.phone || "Sem telefone"}
                                            {client.document_id ? ` • ${client.document_id}` : ""}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.emptyText}>Nenhum cliente cadastrado.</Text>
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
}: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    keyboardType?: "default" | "email-address" | "phone-pad";
}) {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
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
