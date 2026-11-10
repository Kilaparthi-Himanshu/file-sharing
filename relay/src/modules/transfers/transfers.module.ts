import { Module } from "@nestjs/common";

import { SessionsModule } from "./sessions/sessions.module";

@Module({
    imports: [SessionsModule],
    exports: [SessionsModule],
})
export class TransfersModule {}
