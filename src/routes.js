import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, View, ActivityIndicator } from "react-native";
import axios from "axios";
import * as Application from "expo-application";
import { useState, useEffect } from "react";
import {
  contextDeviceId,
  contextDeviceExists,
} from "../context/contextGlobal/contex";
// import {API_URL} from '@env';

import SingUp from "./pages/SingUp/index";
import Ambientes from "./pages/Ambientes/index";
import NovoAmbiente from "./pages/SingUp/novoAmbiente/index";
import Welcome from "./pages/Welcome/index";
import WelcomeBack from "./pages/WelcomeBack/index";
import ControleAcesso from "./pages/ControleAcesso/index";
import AppConfig from "./pages/AppConfig/index";
import Config1 from "./pages/AppConfig/telas/config1";
import Config2 from "./pages/AppConfig/telas/config2";
import Config3 from "./pages/AppConfig/telas/config3";
import Config4 from "./pages/AppConfig/telas/config4";
import Config5 from "./pages/AppConfig/telas/rfid/config5";
import Config6 from "./pages/AppConfig/telas/config6"

const API_URL = "http://150.161.61.1:8181/api";

const Stack = createNativeStackNavigator();

export default function Routes({ route }) {
  const success = route?.success || false;
  const [deviceId, setDeviceId] = useState(null);
  const [isDeviceIdExists, setIsDeviceIdExists] = useState(success);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(null);
  const [nome, setNomeCompleto] = useState(null);

  useEffect(() => {
    const getDeviceId = async () => {
      let id;
      if (Platform.OS === "android") {
        id = await Application.getAndroidId();
      } else if (Platform.OS === "ios") {
        id = await Application.getIosIdForVendorAsync();
      }
      setDeviceId(id);
      console.log("Device ID:", id);
    };
    getDeviceId();
  }, []);

  useEffect(() => {
    const checkDeviceIdExists = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/usuario/${deviceId}`);
        const routerData = response.data;
        if (routerData && routerData.uuid) {
          setIsDeviceIdExists(true);
          setNomeCompleto(routerData.nomeCompleto);
          setEmail(routerData.emailUfpe);
          console.log("Nome:", routerData.nomeCompleto); // Mostre o nome corretamente
        } else {
          setIsDeviceIdExists(false);
        }
      } catch (error) {
        setIsDeviceIdExists(false);
      } finally {
        setLoading(false);
      }
    };

    if (deviceId && !success) {
      checkDeviceIdExists();
    }
  }, [deviceId, success]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size={24} color="#a31821" />
      </View>
    );
  }

  return (
    <contextDeviceId.Provider value={deviceId}>
      <contextDeviceExists.Provider
        value={[isDeviceIdExists, setIsDeviceIdExists]}
      >
        <Stack.Navigator
          screenOptions={{
            headerTitle: "",
            headerTransparent: true,
            headerTintColor: "#FFF",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          {/* Outras telas */}
          {isDeviceIdExists ? (
            <Stack.Screen
              name="Welcome"
              component={Welcome}
              options={{ headerShown: false }}
              initialParams={isDeviceIdExists ? { nome: nome } : {}}
            />
          ) : (
            <Stack.Screen
              name="WelcomeBack"
              component={WelcomeBack}
              options={{ headerShown: false }}
            />
          )}

          <Stack.Screen
            name="SingUp"
            component={SingUp}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="NovoAmbiente"
            component={NovoAmbiente}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="ControleAcesso"
            component={ControleAcesso}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="AppConfig"
            component={AppConfig}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Ambientes"
            component={Ambientes}
            options={{ headerShown: false }}
            initialParams={isDeviceIdExists ? { email: email } : {}}
          />
          <Stack.Screen
            name="Config1"
            component={Config1}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Config2"
            component={Config2}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Config3"
            component={Config3}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Config4"
            component={Config4}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Config5"
            component={Config5}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Config6"
            component={Config6}
            options={{ headerShown: true }}
          />
        </Stack.Navigator>
      </contextDeviceExists.Provider>
    </contextDeviceId.Provider>
  );
}

