import { Test, TestingModule } from '@nestjs/testing';
import { MethodeController } from './methode.controller';

describe('MethodeController', () => {
  let controller: MethodeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MethodeController],
    }).compile();

    controller = module.get<MethodeController>(MethodeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
