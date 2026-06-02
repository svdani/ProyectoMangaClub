import { Test, TestingModule } from '@nestjs/testing';
import { ColeccionController } from './coleccion.controller';

describe('ColeccionController', () => {
  let controller: ColeccionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ColeccionController],
    }).compile();

    controller = module.get<ColeccionController>(ColeccionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
