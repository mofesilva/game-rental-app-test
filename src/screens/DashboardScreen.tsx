import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@cappuccino/web-sdk";

import { getGamesCollection, getRentalsCollection } from "@/lib/cappuccino/collections";
import type { GameRecord } from "@/lib/types/game";
import type { RentalRecord } from "@/lib/types/rental";
import { formatCurrency } from "@/lib/utils/formatters";

const LIMIT = 5;

export function DashboardScreen() {
    const { user, signOut } = useAuth();
    const gamesCollection = useMemo(() => getGamesCollection(), []);
    const rentalsCollection = useMemo(() => getRentalsCollection(), []);
    const [games, setGames] = useState<GameRecord[]>([]);
    const [rentals, setRentals] = useState<RentalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        setRefreshing(true);
        try {
            const [gamesSnapshot, rentalsSnapshot] = await Promise.all([
                gamesCollection.find(),
                rentalsCollection.find(),
            ]);
            setGames(gamesSnapshot.documents ?? []);
            setRentals(rentalsSnapshot.documents ?? []);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [gamesCollection, rentalsCollection]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const activeRentals = useMemo(() => rentals.filter((r) => r.status === "active").length, [rentals]);
    const overdueRentals = useMemo(() => rentals.filter((r) => r.status === "overdue").length, [rentals]);
    const revenue = useMemo(
        () => rentals.reduce((total, rental) => total + (rental.total_amount ?? 0), 0),
        [rentals],
    );

    const latestGames = useMemo(() => games.slice(0, LIMIT), [games]);
    const latestRentals = useMemo(() => rentals.slice(0, LIMIT), [rentals]);

    function handleSignOut() {
        if (!user?._id) return;
        void signOut(user._id);
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Olá, {user?.name ?? "Equipe"} 👋</Text>
                        <Text style={styles.subtitle}>Visão geral do Game Rental direto do Cappuccino.</Text>
                    </View>
                    <Pressable style={styles.signOutButton} onPress={handleSignOut}>
                        <Text style={styles.signOutText}>Sair</Text>
                    </Pressable>
                </View>

                <View style={styles.statsGrid}>
                    <StatCard label="Jogos cadastrados" value={games.length} loading={loading} />
                    <StatCard label="Aluguéis ativos" value={activeRentals} loading={loading} />
                    <StatCard label="Aluguéis atrasados" value={overdueRentals} loading={loading} />
                    <StatCard label="Receita acumulada" value={formatCurrency(revenue)} loading={loading} />
                </View>

                <View style={styles.listsRow}>
                    <InfoCard title="Últimos jogos">
                        <MiniList
                            headers={["Título", "Plataforma", "Preço diário"]}
                            rows={latestGames.map((game) => [
                                game.title,
                                game.platform,
                                formatCurrency(game.daily_price),
                            ])}
                            loading={loading}
                            emptyMessage="Nenhum jogo cadastrado ainda."
                        />
                    </InfoCard>
                    <InfoCard title="Últimos aluguéis">
                        <MiniList
                            headers={["Cliente", "Jogo", "Status"]}
                            rows={latestRentals.map((rental) => [
                                rental.client_name ?? "Cliente não identificado",
                                rental.game_title ?? "Jogo não identificado",
                                rental.status,
                            ])}
                            loading={loading}
                            emptyMessage="Nenhum aluguel encontrado."
                        />
                    </InfoCard>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function StatCard({ label, value, loading }: { label: string; value: string | number; loading: boolean }) {
    return (
        <View style={styles.statCard}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{loading ? "—" : value}</Text>
        </View>
    );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>{title}</Text>
            {children}
        </View>
    );
}

function MiniList({
    headers,
    rows,
    emptyMessage,
    loading,
}: {
    headers: string[];
    rows: string[][];
    emptyMessage: string;
    loading: boolean;
}) {
    if (loading) {
        return <Text style={styles.emptyText}>Carregando…</Text>;
    }
    if (!rows.length) {
        return <Text style={styles.emptyText}>{emptyMessage}</Text>;
    }

    return (
        <View>
            <View style={styles.listHeaderRow}>
                {headers.map((header) => (
                    <Text key={header} style={[styles.listCell, styles.headerCell]}>
                        {header}
                    </Text>
                ))}
            </View>
            {rows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.listRow}>
                    {row.map((value, cellIndex) => (
                        <Text key={`${rowIndex}-${cellIndex}`} style={styles.listCell}>
                            {value}
                        </Text>
                    ))}
                </View>
            ))}
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
    scrollContent: {
        padding: 24,
        gap: 24,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
    },
    greeting: {
        fontSize: 24,
        fontWeight: "700",
        color: "#f8fafc",
    },
    subtitle: {
        fontSize: 16,
        color: "#94a3b8",
        marginTop: 4,
    },
    signOutButton: {
        borderWidth: 1,
        borderColor: "#1e293b",
        borderRadius: 999,
        paddingHorizontal: 18,
        paddingVertical: 8,
    },
    signOutText: {
        color: "#f87171",
        fontWeight: "600",
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    statCard: {
        flexBasis: "48%",
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
        marginTop: 8,
    },
    listsRow: {
        gap: 16,
    },
    infoCard: {
        backgroundColor: "#0f172a",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#1e293b",
        gap: 12,
    },
    infoTitle: {
        color: "#f8fafc",
        fontSize: 18,
        fontWeight: "600",
    },
    emptyText: {
        color: "#94a3b8",
        fontSize: 14,
    },
    listHeaderRow: {
        flexDirection: "row",
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#1e293b",
        paddingBottom: 4,
        marginBottom: 4,
    },
    listRow: {
        flexDirection: "row",
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#1e293b",
    },
    listCell: {
        flex: 1,
        color: "#e2e8f0",
        fontSize: 14,
    },
    headerCell: {
        color: "#94a3b8",
        fontWeight: "600",
    },
});
