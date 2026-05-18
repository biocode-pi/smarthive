import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/context/AuthContext';
import { ApiarioProvider } from '@/context/ApiarioContext';
import { ColmeiaProvider } from '@/context/ColmeiaContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ApiarioProvider>
        <ColmeiaProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="registro" options={{ headerShown: false }} />
              <Stack.Screen name="apiario-detalhe" options={{ headerShown: false }} />
              <Stack.Screen name="adicionar-apiario" options={{ headerShown: false }} />
              <Stack.Screen name="editar-apiario" options={{ headerShown: false }} />
              <Stack.Screen name="adicionar-colmeia" options={{ headerShown: false }} />
              <Stack.Screen name="editar-colmeia" options={{ headerShown: false }} />
              <Stack.Screen name="colmeia-detalhe" options={{ headerShown: false }} />
              <Stack.Screen name="gravacoes" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="dark" backgroundColor="#F5C518" />
          </ThemeProvider>
        </ColmeiaProvider>
      </ApiarioProvider>
    </AuthProvider>
  );
}
