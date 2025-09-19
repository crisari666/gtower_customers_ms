import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtAuthService } from './jwt.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import * as crypto from 'crypto-js';
import { AppConfigService } from '../config/config.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtAuthService: JwtAuthService,
    private readonly appConfigService: AppConfigService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    try {
      const user = await this.usersService.findUserByUsername(username);
      
      if (!user || !user.enabled) {
        return null;
      }

      // Hash the provided password using the same method as in createUser
      const hashKey = this.appConfigService.hashKey;
      const hashedPassword = crypto.HmacSHA256(password, hashKey).toString();

      if (user.password !== hashedPassword) {
        return null;
      }

      return {
        id: (user as any)._id,
        username: user.username,
        enabled: user.enabled,
      };
    } catch (error) {
      return null;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { username: user.username, sub: user.id };
    const access_token = await this.jwtAuthService.generateToken(payload);

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        enabled: user.enabled,
      },
    };
  }

  async getCurrentUser(user: any): Promise<any> {
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return {
      id: user.id,
      username: user.username,
      enabled: user.enabled,
    };
  }
}
