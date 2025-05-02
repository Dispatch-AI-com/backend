import { Controller, Body, Get, Post } from "@nestjs/common";
import { AvailabilityService } from "./availability.service";
import { createAvailDto } from "./dto/create-availability.dto";
import { AvailabilityDocument } from "./schema/availability.schema";

@Controller("avail")
export class AvailabilityController {
  constructor(private readonly availService: AvailabilityService) {}

  @Post("create")
  async create(
    @Body() availDto: createAvailDto,
  ): Promise<AvailabilityDocument> {
    return this.availService.createWorkingHours(availDto);
  }
  @Get("all")
  getAllAvailability() {
    return "ALl availability";
  }
}
