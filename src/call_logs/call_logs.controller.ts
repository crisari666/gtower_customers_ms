import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CallLogsService } from './call_logs.service';
import { CreateCallLogDto } from './dto/create-call_log.dto';
import { UpdateCallLogDto } from './dto/update-call_log.dto';

@Controller('call-logs')
export class CallLogsController {
  constructor(private readonly callLogsService: CallLogsService) {}

  @Post()
  create(@Body() createCallLogDto: CreateCallLogDto) {
    return this.callLogsService.create(createCallLogDto);
  }

  @Get()
  findAll() {
    return this.callLogsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.callLogsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCallLogDto: UpdateCallLogDto) {
    return this.callLogsService.update(+id, updateCallLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.callLogsService.remove(+id);
  }
}
