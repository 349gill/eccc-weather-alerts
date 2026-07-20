import { consumer } from "./consumer.js"
import { handler } from "./handler.js"

import fs from "fs";

// Load Kafka Credentials
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

async function main() {
    const config = readConfig("client.properties");
    const topic = "eccc-events";

    await consumer(topic, config, handler);
}

await main();
