const admin = require("firebase-admin");
const serviceAccount = require("path/to/serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export async function handler(topic, partition, message) {
    admin.messaging().send(message.value)
}
