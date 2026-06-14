import { Test, TestingModule } from '@nestjs/testing';
import { UploadsController } from './uploads.controller';
import { S3Service } from './s3.service';

describe('UploadsController', () => {
  let controller: UploadsController;

  const mockS3Service = {
    uploadFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
