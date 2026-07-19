export async function alerts() {
    const { features } = await (await fetch("https://api.weather.gc.ca/collections/weather-alerts/items?f=json")).json();

    console.log("Fetched Alerts at: ", performance.now());

    return features
        .filter(({ properties }) => properties?.province && properties?.alert_name_en)
        .map(({ properties }) => ({
            id: properties.id,
            message: {
                topic: properties.province,
                notification: {
                    title: `ECCC: ${properties.alert_name_en}`,
                    body: [properties.feature_name_en, properties.alert_text_en?.split("\n")[0]]
                        .filter(Boolean)
                        .join(" — "),
                },
            },
        }));
}
