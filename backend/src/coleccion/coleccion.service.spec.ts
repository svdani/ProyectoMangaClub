import { Test, TestingModule } from '@nestjs/testing';
import { ColeccionService } from './coleccion.service';

describe('ColeccionService', () => {
  let service: ColeccionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ColeccionService],
    }).compile();

    service = module.get<ColeccionService>(ColeccionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
