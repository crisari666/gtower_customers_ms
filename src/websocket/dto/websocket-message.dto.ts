import { IsString, IsNotEmpty, IsOptional, IsDate, IsObject } from 'class-validator';

export class WebSocketMessageDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsObject()
  @IsNotEmpty()
  data: any;

  @IsDate()
  @IsOptional()
  timestamp?: Date;
}

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  roomName: string;
}

export class LeaveRoomDto {
  @IsString()
  @IsNotEmpty()
  roomName: string;
}

export class RoomMessageDto {
  @IsString()
  @IsNotEmpty()
  room: string;

  @IsObject()
  @IsNotEmpty()
  message: WebSocketMessageDto;
}

export class NotificationDto {
  @IsString()
  @IsNotEmpty()
  type: 'info' | 'success' | 'warning' | 'error';

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  senderId: string;

  @IsString()
  @IsNotEmpty()
  senderName: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsDate()
  @IsOptional()
  timestamp?: Date;

  @IsString()
  @IsOptional()
  roomId?: string;
}
