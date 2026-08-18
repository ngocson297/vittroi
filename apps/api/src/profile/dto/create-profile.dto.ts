import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { IsDateOfBirth } from '../../common/date-only.decorators';

export class CreateProfileDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fullName!: string;

  @IsDateOfBirth()
  dateOfBirth!: string;
}
