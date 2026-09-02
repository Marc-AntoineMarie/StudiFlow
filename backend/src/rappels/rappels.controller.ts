import { Controller, Get } from '@nestjs/common';
import { RappelsService } from './rappels.service';

@Controller('rappels')
export class RappelsController {
  constructor(private readonly rappelsService: RappelsService) {}

  @Get()
  get() {
    return this.rappelsService.get();
  }
}
