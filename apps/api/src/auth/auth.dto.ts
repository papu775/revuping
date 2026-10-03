import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';
import { normalizeEmail } from './credentials';

export class EmailDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeEmail(value) : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;
}
export class LoginDto extends EmailDto {
  @IsString()
  @Length(1, 128)
  password!: string;
}
export class RegisterDto extends EmailDto {
  @IsString()
  @Length(12, 128)
  password!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 100)
  displayName!: string;
}
export class TokenDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  token!: string;
}
export class ResetDto extends TokenDto {
  @IsString()
  @Length(12, 128)
  password!: string;
}
export class RefreshDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  refreshToken!: string;
}
