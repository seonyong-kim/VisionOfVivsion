import React from "react";
import * as SecureStore from 'expo-secure-store';

// DB에서 음성정보를 가져오는 함수
export const LoadSpeechInfo = async (setRate, setPitch) => {
    const deviceId = await SecureStore.getItemAsync('deviceId');

    // 서버로 전송 get은 데이터를 쿼리 스트링으로 넘긴다.
    const url = `http://3.37.7.103:5008/setting/speech?device_id=${encodeURIComponent(deviceId)}`;
    try{
        const response = await fetch(url,{
            method: "GET",
            headers:{
            "Content-Type" : "application/json",
            },
        });

        if(response.ok){
          const { rate, pitch } = await response.json();
          setRate(rate);
          setPitch(pitch);
        }else{
          Speech.speak("음성 정보 불러오기 실패");
        }
    } catch(error){
        Speech.speak("서버에 연결 할 수 없습니다.");
        console.log(error);
    }
}