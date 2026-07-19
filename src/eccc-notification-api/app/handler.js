import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("service-key.json", "utf8"));
initializeApp({ credential: cert(serviceAccount) });
console.log("Initialized Firebase Admin")

export async function handler(topic, partition, message) {
    try {
        await getMessaging().send(JSON.parse(message.value.toString()));
        console.log("Sent Message: ", message);
    } catch (e) {
        console.log("Error sending FCM Message: ", e);
    }
}
