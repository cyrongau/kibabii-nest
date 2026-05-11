import { Controller, Get, Param, Query } from '@nestjs/common';
import { NavigationService } from './navigation.service';

@Controller('navigation')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  @Get('directions/:profile/:coordinates')
  async getDirections(
    @Param('profile') profile: string,
    @Param('coordinates') coordinates: string,
    @Query() queryParams: any,
  ) {
    // Expected coordinates format: startLng,startLat;endLng,endLat
    return this.navigationService.getDirections(profile, coordinates, queryParams);
  }
}
