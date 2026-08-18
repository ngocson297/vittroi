import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import type { AuthenticatedPrincipal } from '../auth/auth.types';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';
import type { MotherProfileResponse } from './profile.types';

@Controller('me/profile')
@UseGuards(AccessTokenGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  get(
    @CurrentAuth() auth: AuthenticatedPrincipal,
  ): Promise<MotherProfileResponse> {
    return this.profileService.getForUser(auth.sub);
  }

  @Post()
  create(
    @CurrentAuth() auth: AuthenticatedPrincipal,
    @Body() dto: CreateProfileDto,
  ): Promise<MotherProfileResponse> {
    return this.profileService.createForUser(auth.sub, dto);
  }

  @Patch()
  update(
    @CurrentAuth() auth: AuthenticatedPrincipal,
    @Body() dto: UpdateProfileDto,
  ): Promise<MotherProfileResponse> {
    return this.profileService.updateForUser(auth.sub, dto);
  }
}
