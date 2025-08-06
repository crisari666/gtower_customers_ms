import { Module } from '@nestjs/common';
import { CallLogsService } from './call_logs.service';
import { CallLogsController } from './call_logs.controller';

@Module({
  controllers: [CallLogsController],
  providers: [CallLogsService],
})
export class CallLogsModule {}
