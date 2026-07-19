import fs from "fs";
import pkg from "@confluentinc/kafka-javascript";
const { Kafka } = pkg.KafkaJS;

import { alerts } from "./alerts.js";
import { cache } from "./cache.js";

const POLL_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const TOPIC = "eccc-events";

export function readConfig(fileName) {
    const data = fs.readFileSync(fileName, "utf8").toString().split("\n");
    return data.reduce((config, line) => {
        const [key, value] = line.split("=");
        if (key && value) {
            config[key] = value;
        }
        return config;
    }, {});
}

const producer = new Kafka().producer(readConfig("client.properties"));
await producer.connect();

console.log("Producer initialized with Topic: ", TOPIC);

while (true) {
    for (const { id, message } of await alerts()) {
        if (await cache(id)) {
            await producer.send({
                topic: TOPIC,
                messages: [{ value: JSON.stringify(message) }],
            });
            console.log("Cache miss, Produced: ", message);
        } else {
            console.log("Cache hit, ID: ", id);
        }
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
}
