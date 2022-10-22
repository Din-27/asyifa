import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export function connectToFirestore() {
  const app = initializeApp({
    credential: applicationDefault(),
    projectId: process.env.GCP_PROJECT_ID,
  });

  return getFirestore(app)
}