import http from "http";
import client from "prom-client";

const PORT = Number(process.env.METRICS_PORT) || 9464;

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry, prefix: "eccc_producer_" });

export const amqpDrops = new client.Counter({
    name: "eccc_amqp_drops_total",
    help: "Number of times the AMQP connection to dd.weather.gc.ca dropped",
    registers: [registry],
});

// This service is the only producer on the topic, so this doubles as topic throughput
export const kafkaProduced = new client.Counter({
    name: "eccc_kafka_messages_produced_total",
    help: "Messages successfully produced to Kafka",
    labelNames: ["topic"],
    registers: [registry],
});

// Bound to localhost only; Prometheus runs on the same VM with host networking
http.createServer(async (req, res) => {
    if (req.url !== "/metrics") {
        res.writeHead(404).end();
        return;
    }
    res.writeHead(200, { "Content-Type": registry.contentType });
    res.end(await registry.metrics());
}).listen(PORT, "127.0.0.1", () => console.log("Metrics on 127.0.0.1:" + PORT));
