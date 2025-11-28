import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    ActivityIndicator,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { getGamesCollection } from "@/lib/cappuccino/collections";
import type { GameRecord } from "@/lib/types/game";
import { resolveDocumentId } from "@/lib/utils/documents";
import { formatCurrency } from "@/lib/utils/formatters";

const INITIAL_FORM = {
    title: "",
    platform: "",
    daily_price: "",
    stock: "",
};

export function GamesScreen() {
    const collection = useMemo(() => getGamesCollection(), []);
    const [games, setGames] = useState<GameRecord[]>([]);
    const [form, setForm] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchGames = useCallback(async () => {
        setRefreshing(true);
        const snapshot = await collection.find();
        if (snapshot.error) {
            Alert.alert("Falha ao carregar jogos", snapshot.errorMsg ?? "Tente novamente em instantes.");
        }
        setGames(snapshot.documents ?? []);
        setLoading(false);
        setRefreshing(false);
    }, [collection]);

    useEffect(() => {
        void fetchGames();
    }, [fetchGames]);

    function handleChange(field: keyof typeof INITIAL_FORM, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleCreate() {
        if (!form.title || !form.platform || !form.daily_price || !form.stock) {
            Alert.alert("Campos obrigatórios", "Preencha título, plataforma, preço e estoque.");
            return;
        }
        setSubmitting(true);
        const payload: Partial<GameRecord> = {
            title: form.title.trim(),
            platform: form.platform.trim(),
            daily_price: Number(form.daily_price),
            stock: Number(form.stock),
            created_at: new Date().toISOString(),
        };

        const snapshot = await collection.insertOne(payload as GameRecord);
        setSubmitting(false);
        if (snapshot.error) {
            Alert.alert("Erro", snapshot.errorMsg ?? "Não foi possível salvar o jogo.");
            return;
        }

        const insertedId = resolveDocumentId(snapshot.document);
        const document: GameRecord = {
            _id: insertedId ?? crypto.randomUUID(),
            ...payload,
            ...(snapshot.document ?? {}),
        } as GameRecord;

        setGames((prev) => [document, ...prev]);
        setForm(INITIAL_FORM);
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchGames} />}
            >
                <Text style={styles.title}>Jogos</Text>
                <Text style={styles.subtitle}>Cadastre e acompanhe o catálogo usado nos aluguéis.</Text>

                <View style={styles.cardRow}>
                    <View style={styles.formCard}>
                        <Text style={styles.cardTitle}>Novo jogo</Text>
                        <LabeledInput
                            label="Título"
                            value={form.title}
                            onChangeText={(value) => handleChange("title", value)}
                        />
                        <LabeledInput
                            label="Plataforma"
                            value={form.platform}
                            onChangeText={(value) => handleChange("platform", value)}
                        />
                        <LabeledInput
                            label="Preço diário (R$)"
                            value={form.daily_price}
                            keyboardType="decimal-pad"
                            onChangeText={(value) => handleChange("daily_price", value)}
                        />
                        <LabeledInput
                            label="Estoque"
                            value={form.stock}
                            keyboardType="numeric"
                            onChangeText={(value) => handleChange("stock", value)}
                        />
                        <Pressable
                            style={[styles.primaryButton, submitting && styles.disabledButton]}
                            onPress={handleCreate}
                            disabled={submitting}
                        >
                            <Text style={styles.primaryButtonText}>
                                {submitting ? "Salvando…" : "Salvar jogo"}
                            </Text>
                        </Pressable>
                    </View>

                    <View style={styles.listCard}>
                        <View style={styles.listHeader}>
                            <Text style={styles.cardTitle}>Jogos cadastrados</Text>
                            <Text style={styles.countLabel}>{games.length} itens</Text>
                        </View>
                        {loading ? (
                            <ActivityIndicator color="#38bdf8" />
                        ) : games.length ? (
                            <View style={styles.listContent}>
                                {games.map((game) => (
                                    <View key={game._id ?? game.title} style={styles.listItem}>
                                        <View>
                                            <Text style={styles.itemTitle}>{game.title}</Text>
                                            <Text style={styles.itemSubtitle}>{game.platform}</Text>
                                        </View>
                                        <View style={styles.itemMeta}>
                                            <Text style={styles.itemTitle}>{formatCurrency(game.daily_price)}</Text>
                                            <Text style={styles.itemSubtitle}>{game.stock} em estoque</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.emptyText}>Nenhum jogo cadastrado.</Text>
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
    keyboardType?: "default" | "numeric" | "decimal-pad" | "email-address";
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
    cardTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#f8fafc",
    },
    listCard: {
        backgroundColor: "#0f172a",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#1e293b",
        gap: 12,
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
        flexDirection: "row",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#1e293b",
        borderRadius: 12,
        padding: 12,
        backgroundColor: "#020617",
    },
    itemTitle: {
        color: "#f8fafc",
        fontWeight: "600",
    },
    itemSubtitle: {
        color: "#94a3b8",
        fontSize: 12,
        marginTop: 2,
    },
    itemMeta: {
        alignItems: "flex-end",
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
