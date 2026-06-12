import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';
import { S3Service } from '../uploads/s3.service';
import { callOpenRouter } from '../common/ai-utils';

jest.mock('../common/ai-utils', () => ({
  callOpenRouter: jest.fn(),
  parseAIJson: jest.fn((text) => JSON.parse(text)),
}));

describe('ContractsService', () => {
  let service: ContractsService;
  let s3Service: S3Service;

  const mockS3Service = {
    uploadFile: jest.fn().mockResolvedValue('https://s3.bucket.url/contracts/agreement.pdf'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
    s3Service = module.get<S3Service>(S3Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processContract', () => {
    it('should upload contract to S3 and extract key info using AI', async () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'agreement.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('mock contract content'),
        size: 1024,
      } as Express.Multer.File;

      const aiResponse = JSON.stringify({
        rent: 15000,
        deposit: 15000,
        rules: ['No loud music after 10PM', 'No pets'],
        suggestedName: 'Cozy Haven Single',
        suggestedDescription: 'Beautiful single room near Kibabii gate.',
        signaturesDetected: true,
        partiesIdentified: ['Jane Student', 'John Landlord'],
      });

      (callOpenRouter as jest.Mock).mockResolvedValue(aiResponse);

      const result = await service.processContract(mockFile);

      expect(s3Service.uploadFile).toHaveBeenCalledWith(mockFile, 'contracts');
      expect(callOpenRouter).toHaveBeenCalled();
      expect(result.url).toBe('https://s3.bucket.url/contracts/agreement.pdf');
      expect(result.extractedData.rent).toBe(15000);
      expect(result.extractedData.deposit).toBe(15000);
      expect(result.extractedData.signaturesDetected).toBe(true);
      expect(result.extractedData.rules).toContain('No loud music after 10PM');
    });

    it('should gracefully handle AI extraction failures and return fallback defaults', async () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'agreement.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('mock contract content'),
        size: 1024,
      } as Express.Multer.File;

      (callOpenRouter as jest.Mock).mockRejectedValue(new Error('AI Service Down'));

      const result = await service.processContract(mockFile);

      expect(s3Service.uploadFile).toHaveBeenCalledWith(mockFile, 'contracts');
      expect(result.url).toBe('https://s3.bucket.url/contracts/agreement.pdf');
      expect(result.extractedData.rent).toBe(0);
      expect(result.extractedData.rules).toContain('Failed to extract rules');
      expect(result.extractedData.signaturesDetected).toBe(false);
    });
  });
});
