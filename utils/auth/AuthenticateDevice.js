import { getDeviceId } from "./GetDeviceId";

export const authenticateDevice = async () => {
  const deviceId = await getDeviceId();
  const response = await fetch("서버IP/auth/deviceId", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ deviceId }),
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate device");
  }

  return deviceId;
};
