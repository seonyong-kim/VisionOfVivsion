import AsyncStorage from '@react-native-async-storage/async-storage';
// AsyncStorage를 통해 핸드폰에 처음 시작인지를 저장
export const CheckFirstLaunch = async () => {
    try{
        await AsyncStorage.setItem('isLaunch', 'false');
        const launchValue = await AsyncStorage.getItem('isLaunch');
        if(launchValue === 'true'){
            return {isFirst : false};
        }else{
            await AsyncStorage.setItem('isLaunch', 'true');
            return {isFirst : true};
        }
    }catch(e){
        // 에러에 따라 다르게 하고 싶은데
        return {isFirst: false, error:e};
    }
}