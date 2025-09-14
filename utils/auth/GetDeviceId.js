import * as SecureStore from "expo-secure-store";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

export const getDeviceId = async () => {
  let id = await SecureStore.getItemAsync("deviceId");
  if (!id) {
    id = uuidv4();
    await SecureStore.setItemAsync("deviceId", id);
  }

  return id;
};
