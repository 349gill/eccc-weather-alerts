const fs = require("fs");
const { Kafka } = require("@confluentinc/kafka-javascript").KafkaJS;

function readConfig(fileName) {
    const data = fs.readFileSync(fileName, "utf8").toString().split("\n");
    return data.reduce((config, line) => {
        const [key, value] = line.split("=");
        if (key && value) {
            config[key] = value;
        }
        return config;
    }, {});
}

async function produce(topic, config) {
    const key = "key";
    const value = "value";

    // create a new producer instance
    const producer = new Kafka().producer(config);

    // connect the producer to the broker
    await producer.connect();

    // send a single message
    const produceRecord = await producer.send({
        topic,
        messages: [{ key, value }],
    });
    console.log(
        `\n\n Produced message to topic ${topic}: key = ${key}, value = ${value}, ${JSON.stringify(
            produceRecord,
            null,
            2
        )} \n\n`
    );

    // disconnect the producer
    await producer.disconnect();
}

async function main() {
    const config = readConfig("client.properties");
    const topic = "eccc-events";

    await produce(topic, config);
}

main();