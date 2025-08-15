import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CallLogsService } from './call_logs.service';
import { CreateCallLogDto } from './dto/create-call_log.dto';
import { UpdateCallLogDto } from './dto/update-call_log.dto';

@ApiTags('call-logs')
@Controller('call-logs')
export class CallLogsController {
  constructor(private readonly callLogsService: CallLogsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new call log' })
  @ApiResponse({ status: 201, description: 'Call log created successfully' })
  create(@Body() createCallLogDto: CreateCallLogDto) {
    return this.callLogsService.create(createCallLogDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all call logs' })
  @ApiResponse({ status: 200, description: 'List of all call logs' })
  findAll() {
    return this.callLogsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get call log by ID' })
  @ApiResponse({ status: 200, description: 'Call log found' })
  @ApiResponse({ status: 404, description: 'Call log not found' })
  findOne(@Param('id') id: string) {
    return this.callLogsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update call log by ID' })
  @ApiResponse({ status: 200, description: 'Call log updated successfully' })
  @ApiResponse({ status: 404, description: 'Call log not found' })
  update(@Param('id') id: string, @Body() updateCallLogDto: UpdateCallLogDto) {
    return this.callLogsService.update(+id, updateCallLogDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete call log by ID' })
  @ApiResponse({ status: 200, description: 'Call log deleted successfully' })
  @ApiResponse({ status: 404, description: 'Call log not found' })
  remove(@Param('id') id: string) {
    return this.callLogsService.remove(+id);
  }
}
