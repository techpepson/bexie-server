import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { currency, PaymentMethod } from '../enum/app.enum';

@Injectable()
export class PaymentService {
  logger = new Logger(PaymentService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  async initializePayment(
    email: string,
    amount: number,
    paymentChannel: PaymentMethod,
    displayName: string,
  ) {
    try {
      let channel: any;

      switch (paymentChannel) {
        case PaymentMethod.BANK_TRANSFER:
          channel = 'bank_transfer';
          break;
        case PaymentMethod.CREDIT_CARD:
          channel = 'card';
          break;
        case PaymentMethod.MOBILE_MONEY:
          channel = 'mobile_money';
          break;
        case PaymentMethod.CASH_ON_DELIVERY:
          channel = 'mobile_money';
          break;
        default:
          channel = 'mobile_money';
          break;
      }

      const metadata = { custom_fields: [{ display_name: displayName }] };

      //params for payment gateway
      const params = {
        email,
        amount: amount * 100, //convert to kobo
        channel: channel,
        metadata,
      };

      //options for http request
      const headers = {
        Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      };

      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.paystack.co/transaction/initialize',
          params,
          { headers },
        ),
      );

      if (response.data.status === false) {
        throw new BadGatewayException('Payment initialization failed.');
      }

      return {
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code,
        reference: response.data.data.reference,
        status: response.data.data.status,
      };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof BadGatewayException) {
        throw new BadGatewayException(error.message);
      } else {
        throw new InternalServerErrorException(
          error?.message || 'An error occurred during payment initialization.',
        );
      }
    }
  }

  async verifyPayment(reference: string) {
    try {
      const headers = {
        Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      };
      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.paystack.co/transaction/verify/${reference}`,
          { headers },
        ),
      );

      if (response.data.status === false) {
        throw new BadGatewayException('Payment verification failed.');
      }

      return {
        reference: response.data.data.reference,
        amount: response.data.data.amount / 100, //convert to naira
        status: response.data.data.status, //string (success or failed)
        paidAt: response.data.data.paid_at,
        channel: response.data.data.channel,
        paidReference: response.data.data.reference,
      };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof BadGatewayException) {
        throw new BadGatewayException(error.message);
      } else {
        throw new InternalServerErrorException(
          error?.message || 'An error occurred during payment verification.',
        );
      }
    }
  }

  async initiateTransfer(amount: number, recipient: string, reason: string) {
    try {
      const headers = {
        Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      };

      //payload for the transfer endpoint
      const payload = {
        source: 'balance',
        amount: amount * 100, //convert to kobo
        recipient: recipient,
        reason: reason,
        currency: currency.GHS,
      };

      const response = await firstValueFrom(
        this.httpService.post('https://api.paystack.co/transfer', payload, {
          headers,
        }),
      );

      if (response.data.status === false) {
        throw new BadGatewayException('Transfer initiation failed.');
      }

      return {
        transferCode: response.data.data.transfer_code,
        amount: response.data.data.amount / 100, //convert to naira
        currency: response.data.data.currency,
        status: response.data.data.status, //string (success or failed)
        reason: response.data.data.reason || 'I want to withdraw funds',
        recipient: response.data.data.recipient,
      };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof BadGatewayException) {
        throw new BadGatewayException(error.message);
      } else {
        throw new InternalServerErrorException(
          error?.message || 'An error occurred during transfer initiation.',
        );
      }
    }
  }

  async createTransferRecipient(
    accountNumber: string,
    bankCode: string,
    name: string,
    recipientType: PaymentMethod,
  ) {
    try {
      let newType: any;

      switch (recipientType) {
        case PaymentMethod.BANK_TRANSFER:
          newType = 'nuban';
          break;
        case PaymentMethod.MOBILE_MONEY:
          newType = 'mobile_money';
          break;
        default:
          newType = 'nuban';
          break;
      }
      const headers = {
        Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      };
      const payload = {
        type: newType,
        name: name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'GHS',
      };

      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.paystack.co/transferrecipient',
          payload,
          { headers },
        ),
      );

      if (response.data.status === false) {
        throw new BadGatewayException('Creating transfer recipient failed.');
      }

      return {
        recipientCode: response.data.data.recipient_code,
        name: response.data.data.name,
        accountNumber: response.data.data.details.account_number,
        bankName: response.data.data.details.bank_name,
        bankCode: response.data.data.details.bank_code,
        currency: response.data.data.currency,
      };
    } catch (error) {
      this.logger.error(error);
      if (error instanceof BadGatewayException) {
        throw new BadGatewayException(error.message);
      } else {
        throw new InternalServerErrorException(
          error?.message ||
            'An error occurred during transfer recipient creation.',
        );
      }
    }
  }

  async listTransferRecipients() {
    try {
      const headers = {
        Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      };

      const response = await firstValueFrom(
        this.httpService.get('https://api.paystack.co/transferrecipient', {
          headers,
        }),
      );

      if (response.data.status === false) {
        throw new BadGatewayException('Fetching transfer recipients failed.');
      }

      return {
        recipients: response.data.data,
      }; //array of recipients
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        'An error occurred while fetching transfer recipients.',
      );
    }
  }

  async updateTransferRecipient(recipientCode: string, name: string) {
    try {
      const headers = {
        Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      };

      const payload = {
        name: name,
      };

      const response = await firstValueFrom(
        this.httpService.put(
          `https://api.paystack.co/transferrecipient/${recipientCode}`,
          payload,
          { headers },
        ),
      );

      if (response.data.status === false) {
        throw new BadGatewayException('Updating transfer recipient failed.');
      }

      return {
        recipientCode: response.data.data.recipient_code,
        name: response.data.data.name,
        accountNumber: response.data.data.details.account_number,
        bankName: response.data.data.details.bank_name,
        bankCode: response.data.data.details.bank_code,
        currency: response.data.data.currency,
      };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        'An error occurred during transfer recipient update.',
      );
    }
  }

  async finalizeTransfer(transferCode: string, otp?: string) {
    try {
      const headers = {
        Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      };

      const payload = {
        transfer_code: transferCode,
        otp: otp,
      };

      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.paystack.co/transfer/finalize_transfer',
          payload,
          { headers },
        ),
      );

      if (response.data.status === false) {
        throw new BadGatewayException('Transfer finalization failed.');
      }

      return {
        transferCode: response.data.data.transfer_code,
        amount: response.data.data.amount / 100, //convert to naira
        currency: response.data.data.currency,
        status: response.data.data.status, //string (success or failed)
        reason: response.data.data.reason || 'I want to withdraw funds',
        recipient: response.data.data.recipient,
      };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        'An error occurred during transfer finalization.',
      );
    }
  }

  async listBanks() {
    try {
      const headers = {
        Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      };

      const response = await firstValueFrom(
        this.httpService.get('https://api.paystack.co/bank', { headers }),
      );

      if (response.data.status === false) {
        throw new BadGatewayException('Fetching banks failed.');
      }

      return {
        banks: response.data.data,
      }; //array of banks
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        'An error occurred while fetching banks.',
      );
    }
  }
}
