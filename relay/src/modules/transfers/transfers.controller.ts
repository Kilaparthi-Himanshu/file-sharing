import { Controller, Post } from "@nestjs/common";
import { TransfersService } from "./transfers.service";

@Controller('transfers')
export class TransfersController {
    constructor(
        private readonly transfersService: TransfersService,
    ) {}

    @Post()
    createTransfer() {
        return this.transfersService.createTransfer();
    }
}
