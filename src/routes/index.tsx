import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { AuthRoutes } from "./auth.routes";
import { Box, useTheme } from "native-base";
import { AppRoutes } from "./app.routes";
import { useAuth } from "@hooks/useAuth";
import { Loading } from "@components/Loading";

export function Routes() {
  const { colors } = useTheme();
  const { user, isLoadingUserStorageData } = useAuth();
  const theme = DefaultTheme;
  theme.colors.background = colors.gray[700];
/**
 * Enquanto n foi carregado a aplicacao ira aparecer como loading ate que seja autenticado e salvo na storage
 */
  if (isLoadingUserStorageData) {
    return <Loading />;
  }

  return (
    <Box flex={1} bg="gray.700">
      <NavigationContainer>
        {user.id ? <AppRoutes /> : <AuthRoutes />}
      </NavigationContainer>
    </Box>
  );
}
