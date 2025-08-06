import { PartialType } from '@nestjs/swagger';
import { CreateCallLogDto } from './create-call_log.dto';

export class UpdateCallLogDto extends PartialType(CreateCallLogDto) {}
