import pkg from "@confluentinc/kafka-javascript";
const { Kafka } = pkg.KafkaJS;

export async function consumer(topic, config, handler) {
    // Set the consumer's group ID, offset, and initialize it
    config["group.id"] = "eccc-group";
    config["auto.offset.reset"] = "earliest";
    const kafkaConsumer = new Kafka().consumer(config);

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
            console.log("Consumed: ", message);
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
