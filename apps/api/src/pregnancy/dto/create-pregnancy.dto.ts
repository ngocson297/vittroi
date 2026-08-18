import { IsOnboardingDueDate } from '../../common/date-only.decorators';

export class CreatePregnancyDto {
  @IsOnboardingDueDate()
  dueDate!: string;
}
