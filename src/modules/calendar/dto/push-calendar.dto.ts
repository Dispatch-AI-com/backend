import { IsString, IsOptional } from 'class-validator';

export class PushCalendarDto {
    @IsString()
    title!: string;

    @IsString()
    start!: string;

    @IsString()
    end!: string;

    @IsOptional()
    allDay?: boolean;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    organizer?: string;
}