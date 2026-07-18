import { Kafka } from "kafkajs";
import { fetchAlerts, toFcmMessage } from "./alerts.js";
import { claimAlert, releaseAlert, closeCache } from "./cache.js";

const POLL_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const TOPIC = process.env.KAFKA_TOPIC ?? "weather.alerts";

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID ?? "eccc-producer-service",
  brokers: (process.env.KAFKA_BOOTSTRAP_SERVERS ?? "localhost:9092").split(","),
});

const producer = kafka.producer();

async function publishNewAlerts() {
  const alerts = await fetchAlerts();

  for (const alert of alerts) {
    if (!(await claimAlert(alert.id))) continue;

    try {
      await producer.send({
        topic: TOPIC,
        messages: [{ value: JSON.stringify(toFcmMessage(alert)) }],
      });
    } catch (error) {
      await releaseAlert(alert.id);
    }
  }
}

async function runForever() {
  while (true) {
    await publishNewAlerts()
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

async function shutdown() {
  await producer.disconnect();
  closeCache();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await producer.connect();
await runForever();