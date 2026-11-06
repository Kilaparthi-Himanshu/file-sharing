import { BeforeApplicationShutdown, Injectable } from "@nestjs/common";

@Injectable()
export class HealthService implements BeforeApplicationShutdown {
    private isShuttingDown = false;
    private shutdownSignal?: string;

    private readonly startedAt = new Date();

    getLiveness() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        }
    }

    getReadiness() {
        if (this.isShuttingDown) {
            return {
                status: 'not-ready',
                reason: 'Application is shutting down',
                sginal: this.shutdownSignal,
                timestamp: new Date().toISOString(),
            }
        }

        return {
            status: 'ready',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            startedAt: this.startedAt.toISOString(),
        }
    }

    isReady(): boolean {
        return !this.isShuttingDown;
    }

    beforeApplicationShutdown(signal?: string): void {
        this.isShuttingDown = true;
        this.shutdownSignal = signal;
    }
}
