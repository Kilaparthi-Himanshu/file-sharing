import { Body, Controller, Get, NotFoundException, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { TestValidationDto } from './common/dto/test-validation.dto';

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

  @Post('test-validation')
  testValidation(@Body() dto: TestValidationDto) {
    return {
        message: 'Validation successful',
        data: dto,
    }
  }
}
