import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export const getDeviceId = async () => {
    console.log("디바이스 아이디 얻으러 옴");
    let id = await SecureStore.getItemAsync('deviceId');
    if (!id) {
        id = uuidv4(); // 여기서 UUID 생성
        await SecureStore.setItemAsync('deviceId', id);
    }
    console.log("디바이스 아이디 얻음", id);
    return id;
};