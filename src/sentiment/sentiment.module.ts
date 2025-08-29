import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerSentiment, CustomerSentimentSchema } from './entities/customer-sentiment.entity';
import { CustomerSentimentHistory, CustomerSentimentHistorySchema } from './entities/customer-sentiment-history.entity';
import { Customer, CustomerSchema } from '../customers/entities/customer.entity';
import { CustomerSentimentService } from './services/customer-sentiment.service';
import { CustomerSentimentController } from './controllers/customer-sentiment.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomerSentiment.name, schema: CustomerSentimentSchema },
      { name: CustomerSentimentHistory.name, schema: CustomerSentimentHistorySchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
  ],
  controllers: [CustomerSentimentController],
  providers: [CustomerSentimentService],
  exports: [CustomerSentimentService],
})
export class SentimentModule {}
