import { tenantConfig } from "./tenant-config";

export interface CappuccinoResolvedConfig {
    baseUrl: string;
    apiKey: string;
}

function cleanUrl(url: string): string {
    return url.replace(/\/$/, "");
}

export function resolveCappuccinoConfig(): CappuccinoResolvedConfig {
    const envBaseUrl = process.env.EXPO_PUBLIC_CAPPUCCINO_BASE_URL?.trim();
    const envApiKey = process.env.EXPO_PUBLIC_CAPPUCCINO_API_KEY?.trim();

    const baseUrl = cleanUrl(envBaseUrl || tenantConfig.baseUrl);
    const apiKey = envApiKey || tenantConfig.apiKey;

    if (!baseUrl) {
        throw new Error("Cappuccino base URL is missing.");
    }

    if (!apiKey) {
        throw new Error("Cappuccino API key is missing.");
    }

    return { baseUrl, apiKey };
}
