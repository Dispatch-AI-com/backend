import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GooglePlacesService {
  private apiKey = process.env.GOOGLE_MAPS_API_KEY ?? '';

  async autocomplete(params: {
    input: string;
    sessiontoken?: string;
    types?: string;
    country?: string;
  }): Promise<Record<string, unknown>> {
    const { input, sessiontoken, types, country } = params;
    if (!input.trim()) {
      throw new BadRequestException('input is required');
    }

    this.ensureKey();

    const url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
    const q = new URLSearchParams({
      input: input,
      key: this.apiKey,
    } as Record<string, string>);

    if (typeof sessiontoken === 'string' && sessiontoken.trim() !== '') {
      q.set('sessiontoken', sessiontoken);
    }
    if (typeof types === 'string' && types.trim() !== '') {
      q.set('types', types);
    }
    if (typeof country === 'string' && country.trim() !== '') {
      q.set('components', `country:${country}`);
    }

    const resp = await axios.get(`${url}?${q.toString()}`);
    return resp.data as Record<string, unknown>;
  }

  async details(params: {
    place_id: string;
    fields?: string;
  }): Promise<Record<string, unknown>> {
    const { place_id, fields } = params;
    if (!place_id) throw new BadRequestException('place_id is required');

    this.ensureKey();

    const url = 'https://maps.googleapis.com/maps/api/place/details/json';
    let resolvedFields = 'formatted_address,address_component,geometry,name';
    if (typeof fields === 'string' && fields.trim() !== '') {
      resolvedFields = fields;
    }
    const q = new URLSearchParams({
      place_id,
      key: this.apiKey,
      fields: resolvedFields,
    } as Record<string, string>);

    const resp = await axios.get(`${url}?${q.toString()}`);
    return resp.data as Record<string, unknown>;
  }

  private ensureKey(): void {
    if (!this.apiKey) {
      throw new BadRequestException(
        'Google Maps API key not configured on server',
      );
    }
  }
}
