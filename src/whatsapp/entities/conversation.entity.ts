import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customerId: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  whatsappNumber: string;

  @Prop({ trim: true, index: true })
  conversationId: string;

  @Prop({ default: 'active', enum: ['active', 'closed', 'archived'], index: true })
  status: string;

  @Prop({ type: Date, index: true })
  lastMessageAt: Date;

  @Prop({ type: Number, default: 0 })
  messageCount: number;

  @Prop({ type: String, enum: ['agent', 'customer'], default: 'customer' })
  lastMessageFrom: string;

  @Prop({ type: Date })
  clearedAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
