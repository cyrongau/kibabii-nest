import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NavigationService {
  private readonly logger = new Logger(NavigationService.name);
  private readonly mapboxBaseUrl = 'https://api.mapbox.com/directions/v5/mapbox';

  async getDirections(profile: string, coordinates: string, params: any) {
    try {
      const accessToken = process.env.MAPBOX_PUBLIC_TOKEN;
      if (!accessToken) {
        throw new InternalServerErrorException('Mapbox token not configured');
      }

      const url = `${this.mapboxBaseUrl}/${profile}/${coordinates}`;
      
      const response = await axios.get(url, {
        params: {
          ...params,
          access_token: accessToken,
        },
      });

      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to fetch directions: ${error.message}`);
      if (error.response) {
        throw new InternalServerErrorException(error.response.data);
      }
      throw new InternalServerErrorException('Failed to fetch directions from Mapbox');
    }
  }
}
