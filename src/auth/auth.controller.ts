import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login-local')
  async loginLocal(@Request() req): Promise<AuthResponseDto> {
    return this.authService.login(req.user);
  }

  @Get('me')
  async getCurrentUser(@Request() req): Promise<any> {
    return this.authService.getCurrentUser(req.user);
  }
}
