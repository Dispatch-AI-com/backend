import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class CalendarOAuthService {
  constructor(private readonly configService: ConfigService) {}

  buildGoogleAuthUrl(params: { state: string; userId: string }): string {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID') ?? '';
    const redirectUri =
      this.configService.get<string>('GOOGLE_CALENDAR_REDIRECT_URI') ?? '';

    const base = 'https://accounts.google.com/o/oauth2/v2/auth';
    const query = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar email profile',
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state: JSON.stringify({ s: params.state, u: params.userId }),
    });
    return `${base}?${query.toString()}`;
  }

  async exchangeGoogleCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
    scope?: string;
    tokenType?: string;
  }> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID') ?? '';
    const clientSecret =
      this.configService.get<string>('GOOGLE_CLIENT_SECRET') ?? '';
    const redirectUri =
      this.configService.get<string>('GOOGLE_CALENDAR_REDIRECT_URI') ?? '';

    const url = 'https://oauth2.googleapis.com/token';
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const resp = await axios.post<{
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope?: string;
      token_type?: string;
    }>(url, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return {
      accessToken: resp.data.access_token,
      refreshToken: resp.data.refresh_token,
      expiresIn: resp.data.expires_in,
      scope: resp.data.scope,
      tokenType: resp.data.token_type,
    };
  }

  async refreshGoogleAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
    scope?: string;
    tokenType?: string;
  }> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID') ?? '';
    const clientSecret =
      this.configService.get<string>('GOOGLE_CLIENT_SECRET') ?? '';
    const url = 'https://oauth2.googleapis.com/token';

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const resp = await axios.post<{
      access_token: string;
      expires_in: number;
      scope?: string;
      token_type?: string;
    }>(url, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return {
      accessToken: resp.data.access_token,
      expiresIn: resp.data.expires_in,
      scope: resp.data.scope,
      tokenType: resp.data.token_type,
    };
  }

  /**
   * get user info by access token
   */
  async getUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    name: string;
    picture?: string;
    verified_email: boolean;
  }> {
    const url = 'https://www.googleapis.com/oauth2/v2/userinfo';
    const resp = await axios.get<{
      id: string;
      email: string;
      name: string;
      picture?: string;
      verified_email: boolean;
    }>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      id: resp.data.id,
      email: resp.data.email,
      name: resp.data.name,
      picture: resp.data.picture,
      verified_email: resp.data.verified_email,
    };
  }
}
