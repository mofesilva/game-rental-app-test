export function formatCurrency(value?: number | null) {
    const amount = typeof value === "number" ? value : 0;
    return amount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

export function formatDate(value?: string) {
    if (!value) {
        return "—";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleDateString("pt-BR");
}
