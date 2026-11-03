import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug solo puede contener minúsculas, números y guiones',
  })
  slug: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
