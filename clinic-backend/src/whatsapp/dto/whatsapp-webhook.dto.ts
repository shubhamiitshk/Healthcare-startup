export class WhatsAppContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export class WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type: string; sha256: string; caption?: string };
  document?: { id: string; mime_type: string; sha256: string; filename?: string; caption?: string };
  audio?: { id: string; mime_type: string; sha256: string };
  video?: { id: string; mime_type: string; sha256: string; caption?: string };
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  contacts?: Array<{ name: { formatted_name: string }; phones: Array<{ phone: string; type: string }> }>;
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
    nfm_reply?: { name: string; response_json: string };
  };
  button?: { payload: string; text: string };
  context?: { from: string; id: string; referred_product?: any };
  errors?: Array<{ code: number; title: string; message: string; error_data?: any }>;
}

export class WhatsAppChange {
  value: {
    messaging_product: string;
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: WhatsAppContact[];
    messages?: WhatsAppMessage[];
    statuses?: Array<{
      id: string;
      status: string;
      timestamp: string;
      recipient_id: string;
      conversation?: { id: string; expiration_timestamp: string; origin: { type: string } };
      pricing?: { billable: boolean; pricing_model: string; category: string };
      errors?: Array<{ code: number; title: string; message: string; error_data?: any }>;
    }>;
  };
  field: string;
}

export class WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: WhatsAppChange[];
  }>;
}

export class WhatsAppWebhookQuery {
  'hub.mode': string;
  'hub.verify_token': string;
  'hub.challenge': string;
}