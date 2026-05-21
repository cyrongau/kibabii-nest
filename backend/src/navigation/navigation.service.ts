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
      this.logger.log(`🚗 Fetching directions from Mapbox: ${url}`);
      
      const response = await axios.get(url, {
        params: {
          ...params,
          access_token: accessToken,
        },
      });

      this.logger.log(`✅ Received route from Mapbox for ${coordinates}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`❌ Failed to fetch directions for ${coordinates}: ${error.message}`);
      require('fs').writeFileSync('error_log.txt', `Error: ${error.message}\nStack: ${error.stack}\nToken exists: ${!!process.env.MAPBOX_PUBLIC_TOKEN}`);
      
      if (error.response) {
        this.logger.error(`Mapbox error response: ${JSON.stringify(error.response.data)}`);
        throw new InternalServerErrorException({
          message: 'Mapbox API Error',
          details: error.response.data,
        });
      }
      throw new InternalServerErrorException({
        message: 'Failed to fetch directions from Mapbox',
        error: error.message,
        stack: error.stack,
        tokenExists: !!process.env.MAPBOX_PUBLIC_TOKEN
      });
    }
  }
}
