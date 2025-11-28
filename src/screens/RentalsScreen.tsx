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
import { Picker } from "@react-native-picker/picker";

import { getClientsCollection, getGamesCollection, getRentalsCollection } from "@/lib/cappuccino/collections";
import type { ClientRecord } from "@/lib/types/client";
import type { GameRecord } from "@/lib/types/game";
import type { RentalRecord } from "@/lib/types/rental";
import { resolveDocumentId } from "@/lib/utils/documents";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";

const INITIAL_FORM = {
    client_id: "",
    game_id: "",
    start_date: "",
    end_date: "",
    notes: "",
};

export function RentalsScreen() {
    const rentalsCollection = useMemo(() => getRentalsCollection(), []);
    const gamesCollection = useMemo(() => getGamesCollection(), []);
    const clientsCollection = useMemo(() => getClientsCollection(), []);

    const [rentals, setRentals] = useState<RentalRecord[]>([]);
    const [games, setGames] = useState<GameRecord[]>([]);
    const [clients, setClients] = useState<ClientRecord[]>([]);
    const [form, setForm] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [returningId, setReturningId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setRefreshing(true);
        try {
            const [rentalsSnapshot, gamesSnapshot, clientsSnapshot] = await Promise.all([
                rentalsCollection.find(),
                gamesCollection.find(),
                clientsCollection.find(),
            ]);

            if (rentalsSnapshot.error) {
                Alert.alert("Erro", rentalsSnapshot.errorMsg ?? "Não foi possível carregar os aluguéis.");
            }
            if (gamesSnapshot.error) {
                Alert.alert("Erro", gamesSnapshot.errorMsg ?? "Não foi possível carregar os jogos.");
            }
            if (clientsSnapshot.error) {
                Alert.alert("Erro", clientsSnapshot.errorMsg ?? "Não foi possível carregar os clientes.");
            }

            setRentals(rentalsSnapshot.documents ?? []);
            setGames(gamesSnapshot.documents ?? []);
            setClients(clientsSnapshot.documents ?? []);

            setForm((prev) => ({
                ...prev,
                client_id: prev.client_id || clientsSnapshot.documents?.[0]?._id || "",
                game_id: prev.game_id || gamesSnapshot.documents?.[0]?._id || "",
            }));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [rentalsCollection, gamesCollection, clientsCollection]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const selectedClient = useMemo(
        () => clients.find((client) => client._id === form.client_id),
        [clients, form.client_id],
    );
    const selectedGame = useMemo(() => games.find((game) => game._id === form.game_id), [games, form.game_id]);

    function handleChange(field: keyof typeof INITIAL_FORM, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleCreate() {
        if (!form.client_id || !form.game_id || !form.start_date || !form.end_date) {
            Alert.alert("Campos obrigatórios", "Selecione jogo, cliente e informe as datas.");
            return;
        }

        const start = new Date(form.start_date);
        const end = new Date(form.end_date);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            Alert.alert("Datas inválidas", "Use o formato AAAA-MM-DD para as datas.");
            return;
        }
        if (end.getTime() < start.getTime()) {
            Alert.alert("Intervalo inválido", "A data de devolução deve ser posterior à data inicial.");
            return;
        }
        if (!selectedGame || !selectedClient) {
            Alert.alert("Seleção obrigatória", "Escolha um cliente e um jogo válidos.");
            return;
        }

        setSubmitting(true);
        const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
        const dailyPrice = selectedGame.daily_price ?? 0;
        const totalAmount = totalDays * dailyPrice;
        const payload: Partial<RentalRecord> = {
            client_id: selectedClient._id,
            client_name: selectedClient.name,
            game_id: selectedGame._id,
            game_title: selectedGame.title,
            start_date: form.start_date,
            end_date: form.end_date,
            status: "active",
            daily_price: dailyPrice,
            total_days: totalDays,
            total_amount: totalAmount,
            notes: form.notes.trim() || undefined,
            created_at: new Date().toISOString(),
        };

        const snapshot = await rentalsCollection.insertOne(payload as RentalRecord);
        setSubmitting(false);
        if (snapshot.error) {
            Alert.alert("Erro", snapshot.errorMsg ?? "Não foi possível registrar o aluguel.");
            return;
        }

        const insertedId = resolveDocumentId(snapshot.document);
        const document: RentalRecord = {
            _id: insertedId ?? crypto.randomUUID(),
            ...payload,
            ...(snapshot.document ?? {}),
        } as RentalRecord;

        setRentals((prev) => [document, ...prev]);
        setForm((prev) => ({
            client_id: prev.client_id,
            game_id: prev.game_id,
            start_date: "",
            end_date: "",
            notes: "",
        }));
    }

    async function handleMarkReturned(rental: RentalRecord) {
        setReturningId(rental._id);
        const snapshot = await rentalsCollection.updateOne(rental._id, {
            status: "returned",
            returned_at: new Date().toISOString(),
        } as Partial<RentalRecord>);
        setReturningId(null);
        if (snapshot.error) {
            Alert.alert("Erro", snapshot.errorMsg ?? "Não foi possível finalizar o aluguel.");
            return;
        }

        if (snapshot.document) {
            setRentals((prev) =>
                prev.map((item) => (item._id === rental._id ? (snapshot.document as RentalRecord) : item)),
            );
        } else {
            setRentals((prev) =>
                prev.map((item) => (item._id === rental._id ? { ...item, status: "returned" } : item)),
            );
        }
    }

    const activeCount = useMemo(() => rentals.filter((rental) => rental.status === "active").length, [rentals]);
    const overdueCount = useMemo(() => rentals.filter((rental) => rental.status === "overdue").length, [rentals]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
            >
                <Text style={styles.title}>Aluguéis</Text>
                <Text style={styles.subtitle}>Registre novos aluguéis e acompanhe o status de cada pedido.</Text>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Ativos</Text>
                        <Text style={styles.statValue}>{loading ? "—" : activeCount}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Atrasados</Text>
                        <Text style={styles.statValue}>{loading ? "—" : overdueCount}</Text>
                    </View>
                </View>

                <View style={styles.cardRow}>
                    <View style={styles.formCard}>
                        <Text style={styles.cardTitle}>Novo aluguel</Text>
                        <PickerField
                            label="Cliente"
                            selectedValue={form.client_id}
                            onValueChange={(value) => handleChange("client_id", value)}
                            placeholder="Selecione um cliente"
                            items={clients.map((client) => ({ label: client.name, value: client._id }))}
                        />
                        <PickerField
                            label="Jogo"
                            selectedValue={form.game_id}
                            onValueChange={(value) => handleChange("game_id", value)}
                            placeholder="Selecione um jogo"
                            items={games.map((game) => ({ label: game.title, value: game._id }))}
                        />
                        <LabeledInput
                            label="Data inicial (AAAA-MM-DD)"
                            value={form.start_date}
                            onChangeText={(value) => handleChange("start_date", value)}
                        />
                        <LabeledInput
                            label="Devolução (AAAA-MM-DD)"
                            value={form.end_date}
                            onChangeText={(value) => handleChange("end_date", value)}
                        />
                        <LabeledInput
                            label="Notas"
                            value={form.notes}
                            onChangeText={(value) => handleChange("notes", value)}
                            multiline
                        />
                        <Pressable
                            style={[styles.primaryButton, submitting && styles.disabledButton]}
                            onPress={handleCreate}
                            disabled={submitting}
                        >
                            <Text style={styles.primaryButtonText}>
                                {submitting ? "Registrando…" : "Registrar aluguel"}
                            </Text>
                        </Pressable>
                    </View>

                    <View style={styles.listCard}>
                        <View style={styles.listHeader}>
                            <Text style={styles.cardTitle}>Registros</Text>
                            <Text style={styles.countLabel}>{rentals.length} aluguel(is)</Text>
                        </View>
                        {loading ? (
                            <ActivityIndicator color="#38bdf8" />
                        ) : rentals.length ? (
                            <View style={styles.listContent}>
                                {rentals.map((rental) => (
                                    <View key={rental._id} style={styles.listItem}>
                                        <View style={{ gap: 4 }}>
                                            <Text style={styles.itemTitle}>
                                                {rental.client_name || "Cliente não identificado"}
                                            </Text>
                                            <Text style={styles.itemSubtitle}>
                                                {rental.game_title || "Jogo não identificado"}
                                            </Text>
                                            <Text style={styles.itemMeta}>
                                                {formatDate(rental.start_date)} • {formatDate(rental.end_date)}
                                            </Text>
                                            {rental.notes ? (
                                                <Text style={styles.itemNotes}>{rental.notes}</Text>
                                            ) : null}
                                        </View>
                                        <View style={styles.itemAside}>
                                            <Text style={styles.itemAmount}>{formatCurrency(rental.total_amount)}</Text>
                                            <StatusBadge status={rental.status} />
                                            {rental.status === "active" && (
                                                <Pressable
                                                    style={styles.secondaryButton}
                                                    onPress={() => handleMarkReturned(rental)}
                                                    disabled={returningId === rental._id}
                                                >
                                                    <Text style={styles.secondaryButtonText}>
                                                        {returningId === rental._id ? "Atualizando…" : "Marcar devolvido"}
                                                    </Text>
                                                </Pressable>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.emptyText}>Nenhum aluguel encontrado.</Text>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function PickerField({
    label,
    selectedValue,
    onValueChange,
    placeholder,
    items,
}: {
    label: string;
    selectedValue: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    items: { label: string; value: string }[];
}) {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={styles.pickerWrapper}>
                <Picker
                    selectedValue={selectedValue}
                    onValueChange={onValueChange}
                    dropdownIconColor="#f8fafc"
                    style={styles.picker}
                >
                    <Picker.Item label={placeholder} value="" color="#94a3b8" />
                    {items.map((item) => (
                        <Picker.Item key={item.value} label={item.label} value={item.value} color="#f8fafc" />
                    ))}
                </Picker>
            </View>
        </View>
    );
}

function LabeledInput({
    label,
    value,
    onChangeText,
    multiline,
}: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    multiline?: boolean;
}) {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
                style={[styles.input, multiline && styles.multilineInput]}
                value={value}
                onChangeText={onChangeText}
                placeholderTextColor="#64748b"
                multiline={multiline}
            />
        </View>
    );
}

function StatusBadge({ status }: { status: RentalRecord["status"] }) {
    const styleMap: Record<string, { backgroundColor: string; color: string }> = {
        active: { backgroundColor: "#38bdf822", color: "#38bdf8" },
        overdue: { backgroundColor: "#f9731622", color: "#f97316" },
        returned: { backgroundColor: "#22c55e22", color: "#22c55e" },
    };
    const palette = styleMap[status] ?? { backgroundColor: "#47556944", color: "#cbd5f5" };
    return (
        <Text style={[styles.statusBadge, { backgroundColor: palette.backgroundColor, color: palette.color }]}>
            {status}
        </Text>
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
    statsRow: {
        flexDirection: "row",
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: "#0f172a",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#1e293b",
    },
    statLabel: {
        color: "#94a3b8",
        fontSize: 13,
    },
    statValue: {
        color: "#f8fafc",
        fontSize: 28,
        fontWeight: "700",
        marginTop: 4,
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
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
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
    itemNotes: {
        color: "#94a3b8",
        fontSize: 12,
        marginTop: 4,
    },
    itemAside: {
        alignItems: "flex-end",
        justifyContent: "space-between",
    },
    itemAmount: {
        color: "#f8fafc",
        fontWeight: "600",
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
    primaryButtonText: {
        color: "#f8fafc",
        fontWeight: "600",
    },
    disabledButton: {
        opacity: 0.6,
    },
    secondaryButton: {
        marginTop: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#22c55e",
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    secondaryButtonText: {
        color: "#22c55e",
        fontSize: 12,
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
    multilineInput: {
        minHeight: 72,
        textAlignVertical: "top",
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: "#1e293b",
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: "#020617",
    },
    picker: {
        color: "#f1f5f9",
    },
    statusBadge: {
        textTransform: "uppercase",
        fontSize: 11,
        fontWeight: "600",
        paddingVertical: 2,
        paddingHorizontal: 10,
        borderRadius: 999,
        marginTop: 4,
    },
});
