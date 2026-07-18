import { consumer } from "./consumer"
import { handler } from "./handler.js"

const fs = require("fs");

// Load Confluent Credentials
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

main().then(
    process.exit()
);
