import { ComponentProps, PropsWithChildren, useMemo } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CappuccinoProvider } from "@cappuccino/web-sdk";

import { getCappuccinoClient } from "@/lib/cappuccino/client";

type CappuccinoProviderProps = ComponentProps<typeof CappuccinoProvider>;

/**
 * Root-level providers shared between the navigation tree and feature screens.
 * Extend this component as soon as state managers (query client, theme, etc.) enter the app.
 */
export function AppProviders({ children }: PropsWithChildren) {
    const client = useMemo(() => getCappuccinoClient(), []);

    return (
        <SafeAreaProvider>
            <CappuccinoProvider apiClient={client.apiClient} authManager={client.authManager}>
                {children as CappuccinoProviderProps["children"]}
            </CappuccinoProvider>
        </SafeAreaProvider>
    );
}
