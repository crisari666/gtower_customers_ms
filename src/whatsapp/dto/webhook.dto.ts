export class WebhookMetadataDto {
  display_phone_number: string;
  phone_number_id: string;
}

export class WebhookContactDto {
  profile?: {
    name: string;
  };
  wa_id: string;
  input?: string;
}

export class WebhookMessageDto {
  from?: string;
  id: string;
  timestamp?: string;
  text?: {
    body: string;
  };
  type?: string;
  message_status?: string;
}

export class WebhookStatusDto {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    expiration_timestamp?: string;
    origin?: {
      type: string;
    };
  };
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
    type: string;
  };
}

export class WebhookValueDto {
  messaging_product: string;
  metadata: WebhookMetadataDto;
  contacts?: WebhookContactDto[];
  messages?: WebhookMessageDto[];
  statuses?: WebhookStatusDto[];
}

export class WebhookChangeDto {
  value: WebhookValueDto;
  field: string;
}

export class WebhookEntryDto {
  id: string;
  changes: WebhookChangeDto[];
}

export class WebhookDto {
  object: any;
  entry: any[];
}
