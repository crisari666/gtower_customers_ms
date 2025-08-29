import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer, CustomerDocument } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const createdCustomer = new this.customerModel(createCustomerDto);
    return createdCustomer.save();
  }

  async findAll(): Promise<Customer[]> {
    return this.customerModel.find().exec();
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const updatedCustomer = await this.customerModel
      .findByIdAndUpdate(id, updateCustomerDto, { new: true })
      .exec();
    if (!updatedCustomer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return updatedCustomer;
  }

  async remove(id: string): Promise<void> {
    const result = await this.customerModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
  }

  async markAsProspect(
    customerId: string, 
    prospectSource?: string, 
    additionalNotes?: string
  ): Promise<Customer> {
    const customer = await this.customerModel.findById(customerId).exec();
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const updateData: any = {
      isProspect: true,
      prospectDate: new Date(),
    };

    if (prospectSource) {
      updateData.prospectSource = prospectSource;
    }

    if (additionalNotes) {
      // Store additional notes in a separate field or extend the entity if needed
      // For now, we'll use the existing fields
      updateData.prospectSource = `${prospectSource || 'whatsapp'}_${additionalNotes}`;
    }

    const updatedCustomer = await this.customerModel
      .findByIdAndUpdate(customerId, updateData, { new: true })
      .exec();

    return updatedCustomer;
  }

  async findProspects(): Promise<Customer[]> {
    return this.customerModel.find({ isProspect: true }).exec();
  }

  async getProspectStats(): Promise<{ total: number; thisMonth: number; thisWeek: number }> {
    const total = await this.customerModel.countDocuments({ isProspect: true });
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    
    const thisMonth = await this.customerModel.countDocuments({
      isProspect: true,
      prospectDate: { $gte: startOfMonth }
    });
    
    const thisWeek = await this.customerModel.countDocuments({
      isProspect: true,
      prospectDate: { $gte: startOfWeek }
    });

    return { total, thisMonth, thisWeek };
  }
}
