import amqp from 'amqplib';

 class RabbitMQService {
  constructor(connectionURL, logger = null, duration = true) {
    this.connectionURL = connectionURL;
    this.connection = null;
    this.logger = logger;
    this.channel = null;
    this.exchangeDuration = duration;
    this.queueDuration = duration;
    this.ack = false;
  }

  async connect() {
    this.connection = await amqp.connect(this.connectionURL);
    this.channel = await this.connection.createChannel();
  }

  async close() {
    await this.channel.close();
    await this.connection.close();
  }

  async subscribeTopic(exchangeTopic, routingKey, queueName, callback) {
    await this.channel.assertExchange(exchangeTopic, 'topic', { durable: this.exchangeDuration });
    await this.channel.assertQueue(queueName, { durable: this.queueDuration });
    await this.channel.bindQueue(queueName, exchangeTopic, routingKey);

    this.channel.consume(queueName, (receivedMsg) => {
      if (receivedMsg) { 
        callback(receivedMsg);
        if (this.ack) {
          this.channel.ack(receivedMsg);
        }
      }
    });
  }

  async subscribeDirect(exchange, routingKey, queueName, callback) {
    await this.channel.assertExchange(exchange, 'direct', { durable: this.exchangeDuration });
    await this.channel.assertQueue(queueName, { durable: this.queueDuration });
    await this.channel.bindQueue(queueName, exchange, routingKey);

    this.channel.consume(queueName, (receivedMsg) => {
      if (receivedMsg) {
        // Maybe return receivedMsg directly
        try {
           callback(receivedMsg.content);
          if (this.ack) {
            this.channel.ack(receivedMsg);
          }
        } catch (error) {
          console.error('Enable to read the  message : ', error);
          // push back to the  Queue ?
          if (this.ack) {
            this.channel.nack(receivedMsg);
          } else {
            if (this.logger) {
              logger.error('Msg lost ', receivedMsg);
            } else {
              console.error('Msg lost ', receivedMsg);
            }
          }
        }
      }
    });
  }

  async publishTopic(exchangeTopic, routingKey, message, context = {}, options = {}) {
    // Build the message with request ID, user ID and so on before transmitting
    const messageWithContext = {
      context: context,
      data: message
    };
    const messageBuffer = Buffer.from(JSON.stringify(messageWithContext));
    
    await this.channel.assertExchange(exchangeTopic, 'topic', { durable: options.duration ?? this.exchangeDuration });
    this.channel.publish(topic, routingKey, messageBuffer, options);
  }

  async readyToPublishTopic(exchangeTopic, routingKey, message, context = {}, options = {}) {
    this.connect();
    this.publishTopic(exchangeTopic, routingKey, message, context, options);
    this.close
  }
}

module.exports = RabbitMQService;

