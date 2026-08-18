import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PregnancyController } from './pregnancy.controller';
import { PregnancyService } from './pregnancy.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [PregnancyController],
  providers: [PregnancyService],
})
export class PregnancyModule {}
