import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';
export class UpdateWorkspaceDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 100)
  name!: string;
}
export class CreateWorkspaceDto extends UpdateWorkspaceDto {
  @IsString()
  @Length(1, 64)
  @Matches(/^[A-Za-z0-9_-]+$/)
  key!: string;
}
