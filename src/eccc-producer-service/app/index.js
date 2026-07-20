import fs from "fs";
import pkg from "@confluentinc/kafka-javascript";
const { Kafka } = pkg.KafkaJS;

import { alerts } from "./alerts.js";

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

const config = readConfig("client.properties");

const producer = new Kafka({
    kafkaJS: {
        brokers: [config["bootstrap.servers"]],
        ssl: true
    },
    "security.protocol": config["security.protocol"].toLowerCase(),
    "ssl.ca.location": config["ssl.ca.location"],
    "enable.ssl.certificate.verification": true,
    "sasl.mechanism": config["sasl.mechanisms"],
    "sasl.username": config["sasl.username"],
    "sasl.password": config["sasl.password"]
}).producer();

await producer.connect();

console.log("Producer initialized with Topic: ", TOPIC);

for await (const { id, message } of alerts()) {
    await producer.send({
        topic: TOPIC,
        messages: [{ value: JSON.stringify(message) }],
    });
    console.log("Produced: ", message);
}
