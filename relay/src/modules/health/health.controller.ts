import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import { HealthService } from "./health.service";
import type { FastifyReply } from 'fastify';

@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Get('live')
    getLiveness() {
        return this.healthService.getLiveness();
    }

    @Get('ready')
    getReadiness(@Res({ passthrough: true }) reply: FastifyReply) {
        const ready = this.healthService.isReady();

        reply.status(
            ready
                ? HttpStatus.OK
                : HttpStatus.SERVICE_UNAVAILABLE
        );

        return this.healthService.getReadiness();
    }
}
