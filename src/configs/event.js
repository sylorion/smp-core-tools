// src/configs/event.js
import { appConfig } from './env.js';
import { slug } from '../utils/entityBuilder.js';
import { Kafka } from 'kafkajs';

// kafka configuration
const kafkaConfig = {
    clientId: slug(appConfig.componentName),
        // Put some global environment variable to handle kafka's brokers listing
    brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['kafka1:9096', 'kafka2:9097', 'kafka3:9098']
}
// Créer une instance Kafka
const kafka = new Kafka(kafkaConfig)

export { kafka };