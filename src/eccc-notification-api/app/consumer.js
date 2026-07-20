import pkg from "@confluentinc/kafka-javascript";
const { Kafka } = pkg.KafkaJS;

export async function consumer(topic, config, handler) {
    // Set the consumer's group ID, offset, and initialize it
    const kafkaConsumer = new Kafka({
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
    }).consumer({
        kafkaJS: {
            groupId: "eccc-group"
        }
    });

    // Connect the consumer to the broker
    await kafkaConsumer.connect();

    // Subscribe to the topic
    await kafkaConsumer.subscribe({ topics: [topic] });
    console.log("Consumer subscribed to Topic: ", topic);

    // Setup graceful shutdown
    gracefulShutdown(kafkaConsumer);

    // Consume messages from the topic
    await kafkaConsumer.run({
        eachMessage: async ({topic, partition, message}) => {
            console.log("Consumed: ", message.value?.toString());
            handler(topic, partition, message);
        },
    });
}

function gracefulShutdown(kafkaConsumer) {
    const disconnect = () => {
        kafkaConsumer.commitOffsets().finally(() => {
            console.log("Shutting down Kafka Consumer...");
            kafkaConsumer.disconnect();
        });
    };

    process.on("SIGTERM", disconnect);
    process.on("SIGINT", disconnect);
}
