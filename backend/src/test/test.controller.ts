import { Controller, Get } from '@nestjs/common';

@Controller('test-route')
export class TestController {
  @Get()
  getTest() {
    return { message: 'Test route works' };
  }
}
