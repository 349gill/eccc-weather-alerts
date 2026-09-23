# eccc-weather-alerts
An end-to-end notification system to alert mobile users about weather emergencies in Canada

## Architecture
[![Grafana](https://img.shields.io/badge/Monitoring-Grafana-F46800?style=flat-square&logo=grafana&logoColor=white)](http://40.233.110.153:3000/public-dashboards/e2e62f153c6344afa9a3161af1895780)

This service is only available on Android for now. The Android app is responsible for allowing users to sign up for push notifications.

<img src="assets/app.png" width="50%">

The eccc-producer-service is responsible for fetching the latest updates from the [ECCC API](https://api.weather.gc.ca/collections/weather-alerts?lang=en) and producing each unique weather update as a Kafka event.

The eccc-notification-api is responsible for consuming the latest events from the Kafka Topic and sending push notifications via Firebase Cloud Messaging.

<img src="assets/image.png" width="50%">

## Infrastructure
Both eccc-notification-api and eccc-producer-service are deployed on an Oracle Cloud Compute Instance (Virtual Machine). For the Kafka Cluster, I'm using [Aiven's](https://aiven.io/) Managed Kafka Services.

## Usage
Install the latest version from [releases](releases).
