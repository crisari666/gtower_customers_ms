import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProspectController } from './prospect.controller';
import { ProspectService } from './prospect.service';
import { Customer, CustomerSchema } from '../customers/entities/customer.entity';
import { CustomerSentiment, CustomerSentimentSchema } from '../sentiment/entities/customer-sentiment.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: CustomerSentiment.name, schema: CustomerSentimentSchema },
    ]),
  ],
  controllers: [ProspectController],
  providers: [ProspectService],
})
export class ProspectModule {}
