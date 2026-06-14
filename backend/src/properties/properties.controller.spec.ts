import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';

describe('PropertiesController', () => {
  let controller: PropertiesController;

  const mockPropertiesService = {
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    getLandlordStats: jest.fn(),
    generateAIDescription: jest.fn(),
    findAllAdmin: jest.fn(),
    getAdminStats: jest.fn(),
    findAllLandlord: jest.fn(),
    findOne: jest.fn(),
    verifyProperty: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertiesController],
      providers: [
        { provide: PropertiesService, useValue: mockPropertiesService },
      ],
    }).compile();

    controller = module.get<PropertiesController>(PropertiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
