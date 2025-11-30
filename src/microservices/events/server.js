const express = require("express");
const { Kafka } = require("kafkajs");

const app = express();
app.use(express.json());

const PORT = process.env.PORT;
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || "localhost:9092").split(
  ","
);

const kafka = new Kafka({
  clientId: "events-service",
  brokers: KAFKA_BROKERS,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "events-service-group" });

const TOPICS = {
  MOVIE: "movie-events",
  USER: "user-events",
  PAYMENT: "payment-events",
};

async function initKafka() {
  try {
    await producer.connect();
    await consumer.connect();

    await consumer.subscribe({
      topics: Object.values(TOPICS),
      fromBeginning: false,
    });
    console.log(`Subscribed to topics: ${Object.values(TOPICS).join(", ")}`);

    await consumer.run({
      eachMessage: async ({ message }) => {
        const event = JSON.parse(message.value.toString());

        console.log(`📬 Event received from Kafka`);
        console.log(`Event data:`, JSON.stringify(event, null, 2));
      },
    });

    console.log("Kafka Consumer is running and listening for events...");
  } catch (error) {
    console.error("Failed to initialize Kafka:", error.message);
  }
}

initKafka();

app.get("/api/events/health", (req, res) => {
  res.status(200).json({ status: true });
});

app.post("/api/events/movie", async (req, res) => {
  try {
    const event = {
      ...req.body,
      timestamp: new Date().toISOString(),
      event_id: `movie-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    };

    const result = await producer.send({
      topic: TOPICS.MOVIE,
      messages: [
        {
          key: event.movie_id?.toString(),
          value: JSON.stringify(event),
        },
      ],
    });

    res.status(201).json({
      status: "success",
      partition: result[0].partition,
      offset: result[0].baseOffset,
      event: event,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to publish event" });
  }
});

app.post("/api/events/user", async (req, res) => {
  try {
    const event = {
      ...req.body,
      timestamp: req.body.timestamp || new Date().toISOString(),
      event_id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const result = await producer.send({
      topic: TOPICS.USER,
      messages: [
        {
          key: event.user_id?.toString(),
          value: JSON.stringify(event),
        },
      ],
    });

    res.status(201).json({
      status: "success",
      partition: result[0].partition,
      offset: result[0].baseOffset,
      event: event,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to publish event" });
  }
});

app.post("/api/events/payment", async (req, res) => {
  try {
    const event = {
      ...req.body,
      timestamp: req.body.timestamp || new Date().toISOString(),
      event_id: `payment-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    };

    const result = await producer.send({
      topic: TOPICS.PAYMENT,
      messages: [
        {
          key: event.payment_id?.toString(),
          value: JSON.stringify(event),
        },
      ],
    });

    res.status(201).json({
      status: "success",
      partition: result[0].partition,
      offset: result[0].baseOffset,
      event: event,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to publish event" });
  }
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await consumer.disconnect();
  await producer.disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Events service listening on port ${PORT}`);
});
