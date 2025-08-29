export interface LeadQualification {
  urgency: 'high' | 'medium' | 'low';
  buyingIntent: 'strong' | 'moderate' | 'weak' | 'none';
  budgetIndication: 'high' | 'medium' | 'low' | 'unknown';
  decisionMaker: boolean;
  timeline: 'immediate' | 'short_term' | 'long_term' | 'unknown';
  painPoints: string[];
  objections: string[];
  positiveSignals: string[];
  riskFactors: string[];
  nextBestAction: string;
}

export interface CustomerProfile {
  expertise: 'beginner' | 'intermediate' | 'expert';
  industry: string;
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | 'unknown';
  role: string;
  communicationStyle: 'formal' | 'casual' | 'technical' | 'business';
}

export interface SentimentAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  reasoning: string;
  leadQualification: LeadQualification;
  customerProfile: CustomerProfile;
}
