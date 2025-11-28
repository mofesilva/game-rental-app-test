import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { createCappuccinoClient, createReactNativeStorage, type CappuccinoClient } from "@cappuccino/web-sdk";

import { resolveCappuccinoConfig } from "./config";

let cachedClient: CappuccinoClient | null = null;

function createStorage() {
    return createReactNativeStorage({
        asyncStorage: AsyncStorage,
        secureStore: SecureStore,
        prefix: "game-rental",
        useSecureStoreForAccessToken: true,
    });
}

export function getCappuccinoClient(): CappuccinoClient {
    if (!cachedClient) {
        const env = resolveCappuccinoConfig();
        cachedClient = createCappuccinoClient({
            baseUrl: env.baseUrl,
            apiKey: env.apiKey,
            storage: createStorage(),
            mobile: true,
        });
    }

    return cachedClient;
}
