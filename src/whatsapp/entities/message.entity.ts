import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customerId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  whatsappNumber: string;

  @Prop({ required: true, trim: true })
  whatsappMessageId: string;

  @Prop({ required: true, enum: ['agent', 'customer'] })
  senderType: string;

  @Prop({ required: true, enum: ['text', 'template', 'image', 'audio', 'video', 'document', 'button'] })
  messageType: string;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ required: true, enum: ['pending', 'sent', 'delivered', 'read', 'failed'] })
  status: string;

  @Prop({ type: Date })
  sentAt: Date;

  @Prop({ type: Date })
  deliveredAt: Date;

  @Prop({ type: Date })
  readAt: Date;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: Boolean, default: false })
  isTemplate: boolean;

  @Prop({ trim: true })
  templateName: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
