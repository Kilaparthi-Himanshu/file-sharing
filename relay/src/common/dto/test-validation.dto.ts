import {
    IsInt,
    IsNotEmpty,
    IsString,
    Max,
    MaxLength,
    Min,
} from "class-validator";

export class TestValidationDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    fileName: string;

    @IsInt()
    @Min(1)
    @Max(10737418240)
    fileSize: number;
}
