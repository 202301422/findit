import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import serviceAccount from "./findit-3ba94-firebase-adminsdk-fbsvc-9993e10309.json" with { type: "json" };

if (!getApps().length) {
  initializeApp({
    credential: serviceAccount?.project_id ? cert(serviceAccount) : applicationDefault()
  });
}

export const firebaseAuth = getAuth();