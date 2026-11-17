import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsInt()
  @Min(1)
  userId: number;

  // Tag names, e.g. ["nestjs", "backend"]. Missing tags are created.
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];

  // Task 4: optional category
  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;
}
