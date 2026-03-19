import { Test, TestingModule } from '@nestjs/testing';
import { MethodeService } from './methode.service';

describe('MethodeService', () => {
  let service: MethodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MethodeService],
    }).compile();

    service = module.get<MethodeService>(MethodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
