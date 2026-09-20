import amqp from "amqplib";
import { XMLParser } from "fast-xml-parser";

// Zone-to-province mapping
const SGC_PROVINCE = {
    10: "NL",
    11: "PE",
    12: "NS",
    13: "NB",
    24: "QC",
    35: "ON",
    46: "MB",
    47: "SK",
    48: "AB",
    59: "BC",
    60: "YT",
    61: "NT",
    62: "NU"
};

async function processMessage(msg) {
    const [, baseUrl, relPath] = msg.content.toString().trim().split(/\s+/);

    // Fetch new event
    const xml = await (await fetch(`${baseUrl.replace(/\/$/, "")}/${relPath.replace(/^\//, "")}`)).text();
    const alert = new XMLParser({ ignoreAttributes: false }).parse(xml).alert;

    if (alert.status !== "Actual") {
        console.log("Skipped alert, status:", alert.status);
        return [];
    }

    const events = [];
    for (const info of [alert.info].flat().filter((i) => i?.language?.startsWith("en"))) {
        for (const area of [info.area].flat().filter(Boolean)) {
            // Figure out the province code from the zone
            const sgc = [area.geocode].flat().filter(Boolean).find((g) => String(g?.valueName).startsWith("profile:CAP-CP:Location"))?.value;
            const province = SGC_PROVINCE[String(sgc).slice(0, 2)];
            
            if (!info.event || !area.areaDesc || !province) {
                console.log("Skipped area, missing field(s):", { event: info.event, area: area.areaDesc, sgc });
                continue;
            }

            // Build Kafka Event
            events.push({
                id: `${alert.identifier}:${area.areaDesc}`,
                message: {
                    topic: province,
                    notification: {
                        title: info.event,
                        body: [area.areaDesc, info.description?.trim().split("\n")[0]].filter(Boolean).join(" — "),
                    },
                },
            });
        }
    }

    return events;
}

export async function* alerts() {
    while (true) {
        try {
            const conn = await amqp.connect("amqps://anonymous:anonymous@dd.weather.gc.ca?heartbeat=30");
            conn.on("error", () => {});
            const channel = await conn.createChannel();
            await channel.assertQueue("q_anonymous.sr_subscribe.eccc-weather-alerts.eccc-producer-service-v2", { durable: true });
            await channel.bindQueue("q_anonymous.sr_subscribe.eccc-weather-alerts.eccc-producer-service-v2", "xpublic", "v02.post.*.WXO-DD.alerts.cap.#");

            const queue = [];
            let notify = () => {};
            let closed = false;

            // Must call notify(), or the loop below parks on its promise forever
            const shutdown = () => {
                closed = true;
                notify();
            };
            conn.on("error", shutdown);
            conn.on("close", shutdown);

            console.log("Listening for alerts...");
            await channel.consume("q_anonymous.sr_subscribe.eccc-weather-alerts.eccc-producer-service-v2", (msg) => {
                if (!msg) return shutdown();
                console.log("Received: ", msg.fields.routingKey);
                queue.push(msg);
                notify();
            });

            while (!closed) {
                if (queue.length === 0) {
                    await new Promise((resolve) => (notify = resolve));
                    continue;
                }
                const msg = queue.shift();

                try {
                    const events = await processMessage(msg);
                    if (closed) break; // channel is dead, let the broker redeliver
                    channel.ack(msg);
                    yield* events;
                } catch (err) {
                    console.error("Failed to process alert: ", err);
                    if (closed) break;
                    channel.nack(msg, false, false);
                }
            }
        } catch (err) {
            console.error("Connection Dropped: ", err.message);
        }

        console.log("Reconnecting...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
}
