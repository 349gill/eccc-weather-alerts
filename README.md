# eccc-weather-alerts
An end-to-end notification system to alert mobile users about weather emergencies in Canada

## Architecture
<img src="assets/diagram.png" width="75%">

This service is only available on Android for now. The Android app is responsible for allowing users to sign up for push notifications.

<img src="assets/app.png" width="50%">

The eccc-producer-service is responsible for fetching the latest updates from the [ECCC API](https://api.weather.gc.ca/collections/weather-alerts?lang=en) and producing each unique weather update as a Kafka event.

The eccc-notification-api is responsible for consuming the latest events from the Kafka Topic and sending push notifications via Firebase Cloud Messaging.

## Usage
Install the latest version from [releases](releases).
