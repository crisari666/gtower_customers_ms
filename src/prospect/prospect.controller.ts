import { Controller, Get, Param } from '@nestjs/common';
import { ProspectService } from './prospect.service';
import { ProspectDto } from './dto/prospect.dto';
import { CustomerConfidenceDto } from './dto/customer-confidence.dto';

@Controller('prospects')
export class ProspectController {
  constructor(private readonly prospectService: ProspectService) {}

  @Get()
  async getProspects(): Promise<ProspectDto[]> {
    return this.prospectService.getProspects();
  }

  @Get('by-confidence')
  async getCustomersByConfidence(): Promise<CustomerConfidenceDto[]> {
    return this.prospectService.getCustomersByConfidence();
  }

  @Get(':id')
  async getProspectById(@Param('id') id: string): Promise<ProspectDto | null> {
    return this.prospectService.getProspectById(id);
  }
}
