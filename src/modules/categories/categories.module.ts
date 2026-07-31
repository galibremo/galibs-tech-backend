import { Module } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';

@Module({
    providers: [CategoriesRepository],
})
export class CategoriesModule { }

