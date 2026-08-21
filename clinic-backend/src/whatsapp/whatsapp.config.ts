import { registerAs } from '@nestjs/config';

export default registerAs('whatsapp', () => ({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  apiVersion: process.env.WHATSAPP_API_VERSION || 'v20.0',
  baseUrl: `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v20.0'}`,
  webhookUrl: process.env.WHATSAPP_WEBHOOK_URL,
  templateNamespace: process.env.WHATSAPP_TEMPLATE_NAMESPACE,
}));