/*
https://docs.nestjs.com/providers#services
*/

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PaymentService } from '../payment/payment.service';
import { InternalServerErrorException, Logger } from '@nestjs/common';

@Processor('payment', { lockDuration: 300000 })
export class AppProcessor extends WorkerHost {
  logger = new Logger(AppProcessor.name);
  constructor(private readonly paymentService: PaymentService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    try {
      if (job.name === 'initialize-payment') {
        const { email, amount, paymentChannel, displayName } = job.data;

        const result = await this.paymentService.initializePayment(
          email,
          amount,
          paymentChannel,
          displayName,
        );

        //check if the job was is successful
        if (job.returnvalue && result) {
          this.logger.log(
            `Payment initialization successful for job ${job.id}`,
          );
          //send the return value to the client
          return {
            message: 'Payment initialized successfully',
            authorizationUrl: result.authorizationUrl,
            reference: result.reference,
            accessCode: result.accessCode,
            status: result.status,
          };
        }
      }
    } catch (error) {
      this.logger.error(`Error processing job ${job.name}: ${error.message}`);
      throw new InternalServerErrorException(
        'Error processing payment initialization',
      );
    }
  }
}
