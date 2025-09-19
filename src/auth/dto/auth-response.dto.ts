export class AuthResponseDto {
  access_token: string;
  user: {
    id: string;
    username: string;
    enabled: boolean;
  };
}
