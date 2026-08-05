import { Module } from '@nestjs/common';
import { SpecificationsController } from './specifications.controller';
import { SpecificationsService } from './specifications.service';
import { SpecificationsRepository } from './specifications.repository';

@Module({
    controllers: [SpecificationsController],
    providers: [SpecificationsService, SpecificationsRepository],
    exports: [SpecificationsService],
})
export class SpecificationsModule { }
