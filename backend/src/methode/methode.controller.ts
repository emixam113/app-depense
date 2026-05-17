import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { MethodeService } from './methode.service';
import { JwtAuthGuard } from '../auth/JWT/jwt-auth.guard';

@Controller('methode')
@UseGuards(JwtAuthGuard)
export class MethodeController {
  constructor(private readonly methodeService: MethodeService) {}

  @Post()
  create(@Body() body: { income: number }, @Request() req) {
    return this.methodeService.create(body, req.user);
  }

  @Get()
  findAll(@Request() req) {
    return this.methodeService.findAllForUser(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.methodeService.findOne(+id, req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.methodeService.update(+id, body, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.methodeService.remove(+id, req.user);
  }
}
