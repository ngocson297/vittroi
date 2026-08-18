import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import type { AuthenticatedPrincipal } from '../auth/auth.types';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { CreatePregnancyDto } from './dto/create-pregnancy.dto';
import { PregnancyService } from './pregnancy.service';
import type { PregnanciesResponse, PregnancyResponse } from './pregnancy.types';

@Controller('me/pregnancies')
@UseGuards(AccessTokenGuard)
export class PregnancyController {
  constructor(private readonly pregnancyService: PregnancyService) {}

  @Get()
  list(
    @CurrentAuth() auth: AuthenticatedPrincipal,
  ): Promise<PregnanciesResponse> {
    return this.pregnancyService.listForUser(auth.sub);
  }

  @Get('current')
  current(
    @CurrentAuth() auth: AuthenticatedPrincipal,
  ): Promise<PregnancyResponse> {
    return this.pregnancyService.getCurrentForUser(auth.sub);
  }

  @Post()
  create(
    @CurrentAuth() auth: AuthenticatedPrincipal,
    @Body() dto: CreatePregnancyDto,
  ): Promise<PregnancyResponse> {
    return this.pregnancyService.createForUser(auth.sub, dto);
  }
}
