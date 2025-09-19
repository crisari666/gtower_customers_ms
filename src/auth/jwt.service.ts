import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class JwtAuthService {
  private readonly privateKey: Buffer;
  private readonly publicKey: Buffer;

  constructor(private readonly jwtService: NestJwtService) {
    // Load the private key for signing
    this.privateKey = readFileSync(join(process.cwd(), 'private.pem'));
    // Load the public key for verification
    this.publicKey = readFileSync(join(process.cwd(), 'public.pem'));
  }

  async generateToken(payload: any): Promise<string> {
    return this.jwtService.sign(payload, {
      privateKey: this.privateKey,
      algorithm: 'RS256',
      expiresIn: '7d',
    });
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token, {
        publicKey: this.publicKey,
        algorithms: ['RS256'],
      });
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  getPublicKey(): string {
    return this.publicKey.toString();
  }
}
