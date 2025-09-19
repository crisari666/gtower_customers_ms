import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtAuthService } from '../jwt.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtAuthService: JwtAuthService,
    private readonly usersService: UsersService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip authentication for auth endpoints except /me
    const path = req.baseUrl + req.path;
    console.log({req});
    if (path.includes('/auth') && !path.includes('/auth/me')) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const payload = await this.jwtAuthService.verifyToken(token);
      const user = await this.usersService.findUserById(payload.sub);
      
      if (!user || !user.enabled) {
        throw new UnauthorizedException('User not found or disabled');
      }

      // Add user info to request object
      (req as any).user = {
        id: (user as any)._id,
        username: user.username,
        enabled: user.enabled,
      };

      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
