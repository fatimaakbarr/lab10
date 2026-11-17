import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateNoteDto } from './create-note.dto';

// userId cannot be changed; send "categoryId": null to remove the category
export class UpdateNoteDto extends PartialType(
  OmitType(CreateNoteDto, ['userId'] as const),
) {
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
