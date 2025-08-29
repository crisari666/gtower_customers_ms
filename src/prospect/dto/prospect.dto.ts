import { Types } from 'mongoose';

export class ProspectDto {
  customerId: Types.ObjectId;
  customerName: string;
  isProspect: boolean;
  prospectDate?: Date;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
}
