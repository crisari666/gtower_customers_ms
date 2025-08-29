import { Types } from 'mongoose';

export class CustomerConfidenceDto {
  customerId: Types.ObjectId;
  customerName: string;
  phone: string;
  email: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  isProspect: boolean;
  prospectDate?: Date;
  confidence: number;
}
