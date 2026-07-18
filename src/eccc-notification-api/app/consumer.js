const { Kafka } = require("@confluentinc/kafka-javascript").KafkaJS;

export async function consumer(topic, config, handler) {
    // Set the consumer's group ID, offset, and initialize it
    config["group.id"] = "eccc-group-1";
    config["auto.offset.reset"] = "earliest";
    const kafkaConsumer = new Kafka().consumer(config);

    // Connect the consumer to the broker
    await kafkaConsumer.connect();

    // Subscribe to the topic
    await kafkaConsumer.subscribe({ topics: [topic] });

    // Setup graceful shutdown
    gracefulShutdown(kafkaConsumer);

    // Consume messages from the topic
    await kafkaConsumer.run({
        eachMessage: async ({topic, partition, message}) => {
            handler(topic, partition, message);
        },
    });
}

function gracefulShutdown(kafkaConsumer) {
    const disconnect = () => {
        kafkaConsumer.commitOffsets().finally(() => {
            kafkaConsumer.disconnect();
        });
    };

    process.on("SIGTERM", disconnect);
    process.on("SIGINT", disconnect);
}
