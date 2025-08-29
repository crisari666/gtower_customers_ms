import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CustomerSentimentHistoryDocument = CustomerSentimentHistory & Document;

@Schema({ timestamps: true })
export class CustomerSentimentHistory {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customerId: Types.ObjectId;

  @Prop({ required: true, enum: ['positive', 'negative', 'neutral'], index: true })
  sentiment: 'positive' | 'negative' | 'neutral';

  @Prop({ required: true, min: 0, max: 1 })
  confidence: number;

  @Prop({ required: true })
  reasoning: string;

  @Prop({ required: true, enum: ['high', 'medium', 'low'], index: true })
  urgency: 'high' | 'medium' | 'low';

  @Prop({ required: true, enum: ['strong', 'moderate', 'weak', 'none'], index: true })
  buyingIntent: 'strong' | 'moderate' | 'weak' | 'none';

  @Prop({ required: true, enum: ['high', 'medium', 'low', 'unknown'] })
  budgetIndication: 'high' | 'medium' | 'low' | 'unknown';

  @Prop({ required: true })
  decisionMaker: boolean;

  @Prop({ required: true, enum: ['immediate', 'short_term', 'long_term', 'unknown'] })
  timeline: 'immediate' | 'short_term' | 'long_term' | 'unknown';

  @Prop({ type: [String], default: [] })
  painPoints: string[];

  @Prop({ type: [String], default: [] })
  objections: string[];

  @Prop({ type: [String], default: [] })
  positiveSignals: string[];

  @Prop({ type: [String], default: [] })
  riskFactors: string[];

  @Prop({ required: true })
  nextBestAction: string;

  @Prop({ required: true, enum: ['beginner', 'intermediate', 'expert'] })
  expertise: 'beginner' | 'intermediate' | 'expert';

  @Prop({ required: true })
  industry: string;

  @Prop({ required: true, enum: ['startup', 'small', 'medium', 'large', 'enterprise', 'unknown'] })
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | 'unknown';

  @Prop({ required: true })
  role: string;

  @Prop({ required: true, enum: ['formal', 'casual', 'technical', 'business'] })
  communicationStyle: 'formal' | 'casual' | 'technical' | 'business';

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, index: true })
  conversationId: string;

  @Prop({ required: true })
  messageIndex: number;

  @Prop({ type: Object })
  conversationContext: Record<string, any>;

  @Prop({ required: true })
  analysisTrigger: 'message' | 'manual' | 'scheduled';
}

export const CustomerSentimentHistorySchema = SchemaFactory.createForClass(CustomerSentimentHistory);
