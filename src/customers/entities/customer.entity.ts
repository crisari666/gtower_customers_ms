import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({ timestamps: true })
export class Customer {
  @Prop({ trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({  trim: true, lowercase: true })
  email: string;

  @Prop({ trim: true })
  whatsapp?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ default: false })
  isProspect: boolean;

  @Prop({ type: Date })
  prospectDate?: Date;

  @Prop({ type: String })
  prospectSource?: string;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
