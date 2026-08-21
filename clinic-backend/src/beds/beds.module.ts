import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BedsService } from './beds.service';
import { BedsController } from './beds.controller';
import { Ward } from '../entities/ward.entity';
import { Bed } from '../entities/bed.entity';
import { BedAllocation } from '../entities/bed-allocation.entity';
import { BedEquipment } from '../entities/bed-equipment.entity';
import { Clinic } from '../entities/clinic.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ward, Bed, BedAllocation, BedEquipment, Clinic]),
  ],
  controllers: [BedsController],
  providers: [BedsService],
  exports: [BedsService],
})
export class BedsModule {}
