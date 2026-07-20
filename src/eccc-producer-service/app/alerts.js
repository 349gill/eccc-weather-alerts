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
    const info = [alert.info].flat().find((i) => i.language?.startsWith("en")) ?? [alert.info].flat()[0];
    const areaBlock = [info?.area].flat()[0];

    // Figure out the province code from the zone
    const area = areaBlock?.areaDesc;

    const geocodes = [areaBlock?.geocode].flat().filter(Boolean);
    const sgc = geocodes.find((g) => String(g?.valueName).includes("CAP-CP:Location"))?.value;
    const province = SGC_PROVINCE[String(sgc).padStart(4, "0").slice(0, 2)];

    // Skip anything we can't build a valid notification from
    if (!info?.event || !area || !province) {
        console.log("Skipped alert, missing field(s):", { event: info?.event, area, province });
        return null;
    }

    // Build Kafka Event
    return {
        id: alert.identifier,
        message: {
            topic: province,
            notification: {
                title: `ECCC: ${info.event}`,
                body: [area, info.description?.split("\n")[0]].filter(Boolean).join(" — "),
            },
        },
    };
}

export async function* alerts() {
    const channel = await (await amqp.connect("amqps://anonymous:anonymous@dd.weather.gc.ca")).createChannel();
    await channel.assertQueue("q_anonymous.sr_subscribe.eccc-weather-alerts.eccc-producer-service-v2", { durable: true });
    await channel.bindQueue("q_anonymous.sr_subscribe.eccc-weather-alerts.eccc-producer-service-v2", "xpublic", "v02.post.*.WXO-DD.alerts.cap.#");

    const queue = [];
    let notify = () => {};

    console.log("Listening for ECCC Alerts...");
    await channel.consume("q_anonymous.sr_subscribe.eccc-weather-alerts.eccc-producer-service-v2", (msg) => {
        console.log("Received AMQP message, routing key: ", msg.fields.routingKey);
        queue.push(msg);
        notify();
    });

    while (true) {
        if (queue.length === 0) {
            await new Promise((resolve) => (notify = resolve));
        }
        const msg = queue.shift();

        try {
            const result = await processMessage(msg);
            channel.ack(msg);
            if (result) yield result;
        } catch (err) {
            console.error("Failed to process alert: ", err);
            channel.nack(msg, false, false);
        }
    }
}
