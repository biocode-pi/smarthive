import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { user, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F5C518", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#C8920C" />
      </View>
    );
  }

  return <Redirect href={user ? "/(tabs)/explore" : "/login"} />;
}
