import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomerSentiment, CustomerSentimentDocument } from '../entities/customer-sentiment.entity';
import { CustomerSentimentHistory, CustomerSentimentHistoryDocument } from '../entities/customer-sentiment-history.entity';
import { Customer, CustomerDocument } from '../../customers/entities/customer.entity';
import { SentimentAnalysisResponseDto, SentimentMetricsRequestDto, SentimentMetricsResponseDto } from '../dto/sentiment-analysis.dto';

@Injectable()
export class CustomerSentimentService {
  private readonly logger = new Logger(CustomerSentimentService.name);

  constructor(
    @InjectModel(CustomerSentiment.name) private customerSentimentModel: Model<CustomerSentimentDocument>,
    @InjectModel(CustomerSentimentHistory.name) private customerSentimentHistoryModel: Model<CustomerSentimentHistoryDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  async saveSentimentAnalysis(
    customerId: string,
    conversationId: string,
    messageIndex: number,
    message: string,
    analysisResult: SentimentAnalysisResponseDto,
    conversationContext?: Record<string, any>,
    analysisTrigger: 'message' | 'manual' | 'scheduled' = 'message'
  ): Promise<void> {
    try {
      const customerObjectId = new Types.ObjectId(customerId);

      // Save to history
      const historyEntry = new this.customerSentimentHistoryModel({
        customerId: customerObjectId,
        conversationId,
        messageIndex,
        message,
        conversationContext,
        analysisTrigger,
        ...analysisResult
      });
      await historyEntry.save();

      // Update or create current sentiment
      const currentSentimentData = {
        customerId: customerObjectId,
        lastMessage: message,
        conversationCount: messageIndex,
        ...analysisResult
      };

      await this.customerSentimentModel.findOneAndUpdate(
        { customerId: customerObjectId },
        currentSentimentData,
        { upsert: true, new: true }
      );

      this.logger.log(`Sentiment analysis saved for customer ${customerId}, message ${messageIndex}`);
    } catch (error) {
      this.logger.error(`Error saving sentiment analysis for customer ${customerId}:`, error);
      throw error;
    }
  }

  async getCustomerCurrentSentiment(customerId: string): Promise<CustomerSentiment | null> {
    try {
      const customerObjectId = new Types.ObjectId(customerId);
      return await this.customerSentimentModel.findOne({ customerId: customerObjectId }).exec();
    } catch (error) {
      this.logger.error(`Error retrieving current sentiment for customer ${customerId}:`, error);
      throw error;
    }
  }

  async getCustomerSentimentHistory(
    customerId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<CustomerSentimentHistory[]> {
    try {
      const customerObjectId = new Types.ObjectId(customerId);
      return await this.customerSentimentHistoryModel
        .find({ customerId: customerObjectId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .select('sentiment confidence')
        .exec();
    } catch (error) {
      this.logger.error(`Error retrieving sentiment history for customer ${customerId}:`, error);
      throw error;
    }
  }

  async getSentimentMetrics(filters: SentimentMetricsRequestDto): Promise<SentimentMetricsResponseDto> {
    try {
      const query: any = {};

      if (filters.customerId) {
        query.customerId = new Types.ObjectId(filters.customerId);
      }
      if (filters.sentiment) {
        query.sentiment = filters.sentiment;
      }
      if (filters.urgency) {
        query.urgency = filters.urgency;
      }
      if (filters.buyingIntent) {
        query.buyingIntent = filters.buyingIntent;
      }

      const dateFilter: any = {};
      if (filters.startDate) {
        dateFilter.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        dateFilter.$lte = new Date(filters.endDate);
      }
      if (Object.keys(dateFilter).length > 0) {
        query.createdAt = dateFilter;
      }

      // Get current sentiment metrics
      const currentSentiments = await this.customerSentimentModel.find(query).exec();
      
      const totalCustomers = currentSentiments.length;
      const positiveSentiment = currentSentiments.filter(s => s.sentiment === 'positive').length;
      const negativeSentiment = currentSentiments.filter(s => s.sentiment === 'negative').length;
      const neutralSentiment = currentSentiments.filter(s => s.sentiment === 'neutral').length;
      const highUrgency = currentSentiments.filter(s => s.urgency === 'high').length;
      const strongBuyingIntent = currentSentiments.filter(s => s.buyingIntent === 'strong').length;
      const highBudget = currentSentiments.filter(s => s.budgetIndication === 'high').length;
      const decisionMakers = currentSentiments.filter(s => s.decisionMaker).length;

      // Get sentiment trend (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const trendData = await this.customerSentimentHistoryModel.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            ...query
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              sentiment: '$sentiment'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            sentiments: {
              $push: {
                sentiment: '$_id.sentiment',
                count: '$count'
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const sentimentTrend = trendData.map(day => ({
        date: day._id,
        positive: day.sentiments.find(s => s.sentiment === 'positive')?.count || 0,
        negative: day.sentiments.find(s => s.sentiment === 'negative')?.count || 0,
        neutral: day.sentiments.find(s => s.sentiment === 'neutral')?.count || 0
      }));

      // Get top pain points
      const painPointsAggregation = await this.customerSentimentHistoryModel.aggregate([
        { $match: query },
        { $unwind: '$painPoints' },
        {
          $group: {
            _id: '$painPoints',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      const topPainPoints = painPointsAggregation.map(item => ({
        painPoint: item._id,
        count: item.count
      }));

      // Get top objections
      const objectionsAggregation = await this.customerSentimentHistoryModel.aggregate([
        { $match: query },
        { $unwind: '$objections' },
        {
          $group: {
            _id: '$objections',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      const topObjections = objectionsAggregation.map(item => ({
        objection: item._id,
        count: item.count
      }));

      return {
        totalCustomers,
        positiveSentiment,
        negativeSentiment,
        neutralSentiment,
        highUrgency,
        strongBuyingIntent,
        highBudget,
        decisionMakers,
        sentimentTrend,
        topPainPoints,
        topObjections
      };
    } catch (error) {
      this.logger.error('Error calculating sentiment metrics:', error);
      throw error;
    }
  }

  async getCustomersBySentiment(
    sentiment: 'positive' | 'negative' | 'neutral',
    limit: number = 20,
    offset: number = 0
  ): Promise<Array<CustomerSentiment & { customer: Customer }>> {
    try {
      const sentiments = await this.customerSentimentModel
        .find({ sentiment })
        .sort({ updatedAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec();

      const customersWithData = await Promise.all(
        sentiments.map(async (sentiment) => {
          const customer = await this.customerModel.findById(sentiment.customerId).exec();
          return {
            ...sentiment.toObject(),
            customer: customer?.toObject() || null
          };
        })
      );

      return customersWithData;
    } catch (error) {
      this.logger.error(`Error retrieving customers by sentiment ${sentiment}:`, error);
      throw error;
    }
  }

  async getHighPriorityLeads(limit: number = 20): Promise<Array<CustomerSentiment & { customer: Customer }>> {
    try {
      const highPrioritySentiments = await this.customerSentimentModel
        .find({
          $or: [
            { urgency: 'high' },
            { buyingIntent: 'strong' },
            { sentiment: 'negative' }
          ]
        })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .exec();

      const customersWithData = await Promise.all(
        highPrioritySentiments.map(async (sentiment) => {
          const customer = await this.customerModel.findById(sentiment.customerId).exec();
          return {
            ...sentiment.toObject(),
            customer: customer?.toObject() || null
          };
        })
      );

      return customersWithData;
    } catch (error) {
      this.logger.error('Error retrieving high priority leads:', error);
      throw error;
    }
  }

  async deleteCustomerSentimentData(customerId: string): Promise<void> {
    try {
      const customerObjectId = new Types.ObjectId(customerId);
      
      await Promise.all([
        this.customerSentimentModel.deleteMany({ customerId: customerObjectId }),
        this.customerSentimentHistoryModel.deleteMany({ customerId: customerObjectId })
      ]);

      this.logger.log(`Sentiment data deleted for customer ${customerId}`);
    } catch (error) {
      this.logger.error(`Error deleting sentiment data for customer ${customerId}:`, error);
      throw error;
    }
  }
}
