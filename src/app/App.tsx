import { AppProviders } from "./AppProviders";
import { AppNavigator } from "@/navigation/AppNavigator";

export function App() {
    return (
        <AppProviders>
            <AppNavigator />
        </AppProviders>
    );
}
