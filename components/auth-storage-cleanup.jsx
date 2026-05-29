"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";

const LOCAL_STORAGE_KEYS = ["careersphere.career-navigator.sessions"];

export default function AuthStorageCleanup() {
  const { isLoaded, isSignedIn } = useAuth();
  const wasSignedIn = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      wasSignedIn.current = true;
      return;
    }

    if (wasSignedIn.current) {
      LOCAL_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
      wasSignedIn.current = false;
    }
  }, [isLoaded, isSignedIn]);

  return null;
}
