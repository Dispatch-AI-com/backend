import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinDate,
  ValidateIf,
} from "class-validator";
import { Types } from "mongoose";
import { Transform } from "class-transformer";

export class createAvailDto {
  // @IsNotEmpty()
  // serviceId: Types.ObjectId;
  @IsOptional()
  @IsString()
  serviceId: string;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @IsNotEmpty()
  repeatRule: string;

  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "startTime must be in HH:MM 24-hour format",
  })
  startTime: string;

  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "startTime must be in HH:MM 24-hour format",
  })
  @ValidateIf((obj) => obj.startTime < obj.endTime, {
    message: "startTime must be earlier than endTime",
  })
  endTime: string;

  @IsBoolean()
  isAvailable: boolean;
}
