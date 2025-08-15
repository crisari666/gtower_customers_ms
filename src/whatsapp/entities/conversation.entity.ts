import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customerId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  whatsappNumber: string;

  @Prop({ trim: true })
  conversationId: string;

  @Prop({ default: 'active', enum: ['active', 'closed', 'archived'] })
  status: string;

  @Prop({ type: Date })
  lastMessageAt: Date;

  @Prop({ type: Number, default: 0 })
  messageCount: number;

  @Prop({ type: String, enum: ['agent', 'customer'], default: 'customer' })
  lastMessageFrom: string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
