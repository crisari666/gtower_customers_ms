import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappService } from './whatsapp.service';
import { ConversationService } from './conversation.service';
import { getModelToken } from '@nestjs/mongoose';
import { Customer } from '../customers/entities/customer.entity';

describe('WhatsappService', () => {
  let service: WhatsappService;

  const mockConversationService = {
    findOrCreateConversation: jest.fn(),
    createMessage: jest.fn(),
  };

  const mockCustomerModel = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappService,
        {
          provide: ConversationService,
          useValue: mockConversationService,
        },
        {
          provide: getModelToken(Customer.name),
          useValue: mockCustomerModel,
        },
      ],
    }).compile();

    service = module.get<WhatsappService>(WhatsappService);
    conversationService = module.get<ConversationService>(ConversationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startConversation', () => {
    it('should start a conversation successfully', async () => {
      const mockCustomer = {
        _id: '507f1f77bcf86cd799439011',
        whatsapp: '573108834323',
        name: 'Test Customer',
      };

      const mockConversation = {
        _id: '507f1f77bcf86cd799439012',
        customerId: mockCustomer._id,
        whatsappNumber: mockCustomer.whatsapp,
        status: 'active',
      };

      mockCustomerModel.findById.mockResolvedValue(mockCustomer);
      mockConversationService.findOrCreateConversation.mockResolvedValue(mockConversation);

      // Mock axios response
      jest.spyOn(service as any, 'sendTemplateMessage').mockResolvedValue({
        messages: [{ id: 'wamid.test123' }],
      });

      const result = await service.startConversation({
        customerId: mockCustomer._id,
        templateName: 'hello_world',
        languageCode: 'en_US',
      });

      expect(result.success).toBe(true);
      expect(result.conversationId).toBe(mockConversation._id);
      expect(mockConversationService.findOrCreateConversation).toHaveBeenCalledWith(
        mockCustomer._id,
        mockCustomer.whatsapp
      );
    });

    it('should throw error if customer not found', async () => {
      mockCustomerModel.findById.mockResolvedValue(null);

      await expect(
        service.startConversation({
          customerId: 'invalid-id',
          templateName: 'hello_world',
        })
      ).rejects.toThrow('Customer not found');
    });

    it('should throw error if customer has no WhatsApp number', async () => {
      const mockCustomer = {
        _id: '507f1f77bcf86cd799439011',
        whatsapp: null,
        name: 'Test Customer',
      };

      mockCustomerModel.findById.mockResolvedValue(mockCustomer);

      await expect(
        service.startConversation({
          customerId: mockCustomer._id,
          templateName: 'hello_world',
        })
      ).rejects.toThrow('Customer does not have WhatsApp number');
    });
  });

  describe('sendTextMessage', () => {
    it('should send text message successfully', async () => {
      const mockConversation = {
        _id: '507f1f77bcf86cd799439012',
        customerId: '507f1f77bcf86cd799439011',
        whatsappNumber: '573108834323',
      };

      mockConversationService.findConversationByWhatsappNumber.mockResolvedValue(mockConversation);

      // Mock axios response
      jest.spyOn(service as any, 'sendTextMessage').mockResolvedValue({
        messages: [{ id: 'wamid.test123' }],
      });

      const result = await service.sendTextMessage('573108834323', 'Hello!', '507f1f77bcf86cd799439011');

      expect(result).toBeDefined();
      expect(mockConversationService.createMessage).toHaveBeenCalled();
    });
  });
});
