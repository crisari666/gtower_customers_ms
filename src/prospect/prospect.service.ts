import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Customer, CustomerDocument } from '../customers/entities/customer.entity';
import { CustomerSentiment, CustomerSentimentDocument } from '../sentiment/entities/customer-sentiment.entity';
import { ProspectDto } from './dto/prospect.dto';
import { CustomerConfidenceDto } from './dto/customer-confidence.dto';

@Injectable()
export class ProspectService {
  constructor(
    @InjectModel(Customer.name) private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(CustomerSentiment.name) private readonly sentimentModel: Model<CustomerSentimentDocument>,
  ) {}

  async getProspects(): Promise<ProspectDto[]> {
    const prospects = await this.customerModel.aggregate([
      {
        $match: { isProspect: true }
      },
      {
        $lookup: {
          from: 'customersentiments',
          localField: '_id',
          foreignField: 'customerId',
          as: 'sentimentData'
        }
      },
      {
        $unwind: {
          path: '$sentimentData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          customerId: '$_id',
          customerName: '$name',
          isProspect: '$isProspect',
          prospectDate: '$prospectDate',
          sentiment: {
            $ifNull: ['$sentimentData.sentiment', 'neutral']
          },
          confidence: {
            $ifNull: ['$sentimentData.confidence', 0]
          }
        }
      }
    ]).exec();

    return prospects;
  }

  async getProspectById(customerId: string): Promise<ProspectDto | null> {
    const prospects = await this.customerModel.aggregate([
      {
        $match: { 
          _id: new Types.ObjectId(customerId), 
          isProspect: true 
        }
      },
      {
        $lookup: {
          from: 'customersentiments',
          localField: '_id',
          foreignField: 'customerId',
          as: 'sentimentData'
        }
      },
      {
        $unwind: {
          path: '$sentimentData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          customerId: '$_id',
          customerName: '$name',
          isProspect: '$isProspect',
          prospectDate: '$prospectDate',
          sentiment: {
            $ifNull: ['$sentimentData.sentiment', 'neutral']
          },
          confidence: {
            $ifNull: ['$sentimentData.confidence', 0]
          }
        }
      }
    ]).exec();

    return prospects.length > 0 ? prospects[0] : null;
  }

  async getCustomersByConfidence(): Promise<CustomerConfidenceDto[]> {
    const customers = await this.customerModel.aggregate([
      {
        $lookup: {
          from: 'customersentiments',
          localField: '_id',
          foreignField: 'customerId',
          as: 'sentimentData'
        }
      },
      {
        $match: {
          'sentimentData.0': { $exists: true }
        }
      },
      {
        $unwind: {
          path: '$sentimentData',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $project: {
          customerId: '$_id',
          customerName: '$name',
          phone: '$phone',
          email: '$email',
          sentiment: '$sentimentData.sentiment',
          isProspect: '$isProspect',
          prospectDate: '$prospectDate',
          confidence: '$sentimentData.confidence'
        }
      },
      {
        $sort: { confidence: -1 }
      }
    ]).exec();

    return customers;
  }
}
