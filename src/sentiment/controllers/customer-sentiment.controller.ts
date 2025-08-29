import { Controller, Get, Post, Body, Param, Query, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { CustomerSentimentService } from '../services/customer-sentiment.service';
import { SentimentAnalysisRequestDto, SentimentMetricsRequestDto } from '../dto/sentiment-analysis.dto';

@Controller('sentiment')
export class CustomerSentimentController {
  constructor(private readonly customerSentimentService: CustomerSentimentService) {}

  @Get('current/:customerId')
  async getCustomerCurrentSentiment(@Param('customerId') customerId: string) {
    const sentiment = await this.customerSentimentService.getCustomerCurrentSentiment(customerId);
    if (!sentiment) {
      return { message: 'No sentiment data found for this customer' };
    }
    return sentiment;
  }

  @Get('history/:customerId')
  async getCustomerSentimentHistory(
    @Param('customerId') customerId: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0'
  ) {
    const history = await this.customerSentimentService.getCustomerSentimentHistory(
      customerId,
      parseInt(limit),
      parseInt(offset)
    );
    return {
      customerId,
      totalEntries: history.length,
      history
    };
  }

  @Get('metrics')
  async getSentimentMetrics(@Query() filters: SentimentMetricsRequestDto) {
    return await this.customerSentimentService.getSentimentMetrics(filters);
  }

  @Get('customers/positive')
  async getPositiveSentimentCustomers(
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0'
  ) {
    return await this.customerSentimentService.getCustomersBySentiment(
      'positive',
      parseInt(limit),
      parseInt(offset)
    );
  }

  @Get('customers/negative')
  async getNegativeSentimentCustomers(
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0'
  ) {
    return await this.customerSentimentService.getCustomersBySentiment(
      'negative',
      parseInt(limit),
      parseInt(offset)
    );
  }

  @Get('customers/neutral')
  async getNeutralSentimentCustomers(
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0'
  ) {
    return await this.customerSentimentService.getCustomersBySentiment(
      'neutral',
      parseInt(limit),
      parseInt(offset)
    );
  }

  @Get('leads/high-priority')
  async getHighPriorityLeads(@Query('limit') limit: string = '20') {
    return await this.customerSentimentService.getHighPriorityLeads(parseInt(limit));
  }

  @Get('leads/urgent')
  async getUrgentLeads(@Query('limit') limit: string = '20') {
    const urgentSentiments = await this.customerSentimentService.getSentimentMetrics({
      urgency: 'high'
    });
    return {
      totalUrgent: urgentSentiments.highUrgency,
      message: 'Use getHighPriorityLeads endpoint for detailed urgent lead information'
    };
  }

  @Get('leads/strong-intent')
  async getStrongIntentLeads(@Query('limit') limit: string = '20') {
    const strongIntentSentiments = await this.customerSentimentService.getSentimentMetrics({
      buyingIntent: 'strong'
    });
    return {
      totalStrongIntent: strongIntentSentiments.strongBuyingIntent,
      message: 'Use getHighPriorityLeads endpoint for detailed strong intent lead information'
    };
  }

  @Get('analytics/trends')
  async getSentimentTrends(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const metrics = await this.customerSentimentService.getSentimentMetrics({
      startDate,
      endDate
    });
    return {
      sentimentTrend: metrics.sentimentTrend,
      totalCustomers: metrics.totalCustomers,
      period: { startDate, endDate }
    };
  }

  @Get('analytics/pain-points')
  async getTopPainPoints() {
    const metrics = await this.customerSentimentService.getSentimentMetrics({});
    return {
      topPainPoints: metrics.topPainPoints,
      totalCustomers: metrics.totalCustomers
    };
  }

  @Get('analytics/objections')
  async getTopObjections() {
    const metrics = await this.customerSentimentService.getSentimentMetrics({});
    return {
      topObjections: metrics.topObjections,
      totalCustomers: metrics.totalCustomers
    };
  }

  @Delete(':customerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCustomerSentimentData(@Param('customerId') customerId: string) {
    await this.customerSentimentService.deleteCustomerSentimentData(customerId);
    return { message: 'Sentiment data deleted successfully' };
  }

  @Post('analyze')
  async analyzeCustomerSentiment(@Body() analysisRequest: SentimentAnalysisRequestDto) {
    // This endpoint would typically call the LangChain service
    // For now, it's a placeholder for manual sentiment analysis
    return {
      message: 'Manual sentiment analysis requested',
      request: analysisRequest,
      note: 'Use the LangChain service for actual sentiment analysis'
    };
  }
}
