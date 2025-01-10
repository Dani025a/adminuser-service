import { getRabbitMQConnection } from './connection';

export const publishResetPasswordMessage = async (email: string, resetToken: string) => {
  const connection = await getRabbitMQConnection();
  const channel = await connection.createChannel();

  const queue = 'Reset_Password';
  await channel.assertQueue(queue, { durable: true });

  const user = "admin"

  const message = JSON.stringify({ email, resetToken, user });
  channel.sendToQueue(queue, Buffer.from(message));

  console.log(`Published message to Reset_Password: ${message}`);
  
  await channel.close();
};
