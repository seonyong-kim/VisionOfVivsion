// hooks/useIntent.js
import { useEffect, useRef } from "react";
import { intentRouter } from "../services/intentRouter";

export function useIntent(intents, handler, { priority = 0 } = {}) {
  const tokenRef = useRef(null);

  useEffect(() => {
    if (!intents || !intents.length || typeof handler !== "function") return;
    tokenRef.current = intentRouter.subscribe({ intents, handler, priority });
    return () => {
      if (tokenRef.current) intentRouter.unsubscribe(tokenRef.current);
      tokenRef.current = null;
    };
  }, [JSON.stringify(intents), handler, priority]);
}
