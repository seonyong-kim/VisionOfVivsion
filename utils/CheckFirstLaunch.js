import AsyncStorage from "@react-native-async-storage/async-storage";
export const CheckFirstLaunch = async () => {
  try {
    await AsyncStorage.setItem("isLaunch", "false");
    const launchValue = await AsyncStorage.getItem("isLaunch");
    if (launchValue === "true") {
      return { isFirst: false };
    } else {
      await AsyncStorage.setItem("isLaunch", "true");
      return { isFirst: true };
    }
  } catch (e) {
    return { isFirst: false, error: e };
  }
};
