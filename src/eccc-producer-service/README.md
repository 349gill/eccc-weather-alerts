# Node.js Client

This project contains a Node.js application that subscribes to a topic on a Confluent Cloud Kafka cluster and sends a sample message, then consumes it and prints the consumed record to the console.

## Prerequisites

Any supported version of Node.js (The two LTS versions, 18 and 20, and the latest versions, 21 and 22).

## Installation

Install the dependencies of this application:

```shell
npm install @confluentinc/kafka-javascript
```

## Usage

You can execute the consumer script by running:

```shell
node index.js
```

## Learn more

- For the Node.js client API, check out the [confluent-kafka-javascript documentation](https://github.com/confluentinc/confluent-kafka-javascript#readme)
- Check out the full [getting started tutorial](https://developer.confluent.io/get-started/nodejs/)