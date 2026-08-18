import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { IsDateOfBirth } from '../../common/date-only.decorators';

export class UpdateProfileDto {
  @ValidateIf((_dto: UpdateProfileDto, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fullName?: string;

  @ValidateIf((_dto: UpdateProfileDto, value: unknown) => value !== undefined)
  @IsDateOfBirth()
  dateOfBirth?: string;
}
