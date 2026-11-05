import { Controller, Get, NotFoundException } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-error')
  testError(): never {
    throw new NotFoundException('Test resource not found');
  }

  @Get('test-crash')
  testCrash(): never {
    throw new Error('Internal test error');
  }
}
