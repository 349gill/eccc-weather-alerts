const ALERTS_URL =
  "https://api.weather.gc.ca/collections/weather-alerts/items?f=json";
const REQUEST_TIMEOUT_MS = 30_000;

export async function fetchAlerts() {
  const response = await fetch(ALERTS_URL, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { "User-Agent": "eccc-producer-service/1.0" },
  });

  if (!response.ok) throw new Error(`alerts request failed: ${response.status}`);

  const { features = [] } = await response.json();
  return features.map(toAlert).filter(isPublishable);
}

function toAlert({ id, properties = {} }) {
  return {
    id: id ?? properties.id,
    province: properties.province,
    name: properties.alert_name_en,
    region: properties.feature_name_en,
    summary: firstLine(properties.alert_text_en),
  };
}

function isPublishable(alert) {
  return Boolean(alert.id && alert.province && alert.name);
}

function firstLine(text = "") {
  return text.split("\n").find((line) => line.trim()) ?? "";
}

export function toFcmMessage(alert) {
  return {
    topic: alert.province,
    notification: {
      title: `ECCC: ${alert.name}`,
      body: [alert.region, alert.summary].filter(Boolean).join(" — "),
    },
  };
}