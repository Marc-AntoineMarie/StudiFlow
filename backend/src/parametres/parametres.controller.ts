import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ParametresService } from './parametres.service';
import { UpdateConfigDto } from './dto/update-config.dto';

@Controller('parametres')
export class ParametresController {
  constructor(private readonly parametresService: ParametresService) {}

  @Get()
  get() {
    return this.parametresService.get();
  }

  @Patch()
  update(@Body() dto: UpdateConfigDto) {
    return this.parametresService.update(dto);
  }
}
