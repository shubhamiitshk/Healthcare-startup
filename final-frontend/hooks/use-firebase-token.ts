import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

export function useFirebaseToken() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const t = await user.getIdToken();
        setToken(t);
      } else {
        setToken(null);
      }
    });
    return () => unsubscribe();
  }, []);
  return token;
}
