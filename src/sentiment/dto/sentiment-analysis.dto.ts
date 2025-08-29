import { IsString, IsEnum, IsNumber, IsBoolean, IsArray, IsOptional, IsMongoId, Min, Max } from 'class-validator';

export class SentimentAnalysisRequestDto {
  @IsString()
  message: string;

  @IsMongoId()
  customerId: string;

  @IsString()
  conversationId: string;

  @IsNumber()
  messageIndex: number;

  @IsOptional()
  conversationContext?: Record<string, any>;
}

export class SentimentAnalysisResponseDto {
  @IsEnum(['positive', 'negative', 'neutral'])
  sentiment: 'positive' | 'negative' | 'neutral';

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @IsString()
  reasoning: string;

  @IsEnum(['high', 'medium', 'low'])
  urgency: 'high' | 'medium' | 'low';

  @IsEnum(['strong', 'moderate', 'weak', 'none'])
  buyingIntent: 'strong' | 'moderate' | 'weak' | 'none';

  @IsEnum(['high', 'medium', 'low', 'unknown'])
  budgetIndication: 'high' | 'medium' | 'low' | 'unknown';

  @IsBoolean()
  decisionMaker: boolean;

  @IsEnum(['immediate', 'short_term', 'long_term', 'unknown'])
  timeline: 'immediate' | 'short_term' | 'long_term' | 'unknown';

  @IsArray()
  @IsString({ each: true })
  painPoints: string[];

  @IsArray()
  @IsString({ each: true })
  objections: string[];

  @IsArray()
  @IsString({ each: true })
  positiveSignals: string[];

  @IsArray()
  @IsString({ each: true })
  riskFactors: string[];

  @IsString()
  nextBestAction: string;

  @IsEnum(['beginner', 'intermediate', 'expert'])
  expertise: 'beginner' | 'intermediate' | 'expert';

  @IsString()
  industry: string;

  @IsEnum(['startup', 'small', 'medium', 'large', 'enterprise', 'unknown'])
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | 'unknown';

  @IsString()
  role: string;

  @IsEnum(['formal', 'casual', 'technical', 'business'])
  communicationStyle: 'formal' | 'casual' | 'technical' | 'business';
}

export class SentimentMetricsRequestDto {
  @IsOptional()
  @IsMongoId()
  customerId?: string;

  @IsOptional()
  @IsEnum(['positive', 'negative', 'neutral'])
  sentiment?: 'positive' | 'negative' | 'neutral';

  @IsOptional()
  @IsEnum(['high', 'medium', 'low'])
  urgency?: 'high' | 'medium' | 'low';

  @IsOptional()
  @IsEnum(['strong', 'moderate', 'weak', 'none'])
  buyingIntent?: 'strong' | 'moderate' | 'weak' | 'none';

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}

export class SentimentMetricsResponseDto {
  @IsNumber()
  totalCustomers: number;

  @IsNumber()
  positiveSentiment: number;

  @IsNumber()
  negativeSentiment: number;

  @IsNumber()
  neutralSentiment: number;

  @IsNumber()
  highUrgency: number;

  @IsNumber()
  strongBuyingIntent: number;

  @IsNumber()
  highBudget: number;

  @IsNumber()
  decisionMakers: number;

  @IsArray()
  sentimentTrend: Array<{
    date: string;
    positive: number;
    negative: number;
    neutral: number;
  }>;

  @IsArray()
  topPainPoints: Array<{
    painPoint: string;
    count: number;
  }>;

  @IsArray()
  topObjections: Array<{
    objection: string;
    count: number;
  }>;
}
