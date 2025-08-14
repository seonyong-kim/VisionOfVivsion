import { getDeviceId } from './GetDeviceId';

export const authenticateDevice = async () => {
    console.log("3 인증 시작");
    // 토큰없이 deviceId로 인증 시작
    const deviceId = await getDeviceId();
    const response = await fetch('http://3.37.7.103:5006/auth/deviceId',{
        method: 'POST',
        headers:{
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({deviceId}),
    });

    console.log("DB까지는 성공");
    if(!response.ok){
        throw new Error('Failed to authenticate device');
    }

    return deviceId;
}