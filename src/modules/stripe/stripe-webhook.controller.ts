import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Controller('webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post('stripe')
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    let event: Stripe.Event;

    try {
      event = this.stripeService.constructWebhookEvent(req.body, signature);
    } catch (err: any) {
      this.logger.error('❌ Stripe signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`✅ Stripe Event: ${event.type}`);

    // 只处理 invoice.payment_succeeded
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;

      await this.paymentService.createPaymentRecord({
        subscriptionId: invoice.subscription as string,
        invoiceId: invoice.id,
        customerId: invoice.customer as string,
        chargeId: invoice.charge as string,
        amountPaid: invoice.amount_paid,
      });

      this.logger.log(`Payment record saved for invoice: ${invoice.id}`);
    }
  }
}

//     switch (event.type) {
//       /**
//        * Step 1: Session completed (订阅已成功创建，但不一定付款成功)
//        */
//       case 'checkout.session.completed': {
//         const session = event.data.object as Stripe.Checkout.Session;
//         const { companyId, planId } = session.metadata || {};
//         const subscriptionId = session.subscription as string;

//         // 先记录订阅初始化 (你在 createSubscription() 里已经做了)
//         this.logger.log(
//           `✅ checkout.session.completed received for companyId=${companyId}, planId=${planId}`
//         );

//         // ⚠️ 注意：你这一步暂时不用做 DB 操作，真正 activation 在 payment_intent.succeeded 完成
//         break;
//       }

//       /**
//        * Step 2: payment_intent.succeeded (实际扣款成功)
//        */
//       case 'payment_intent.succeeded': {
//         const paymentIntent = event.data.object as Stripe.PaymentIntent;
//         const paymentIntentId = paymentIntent.id;
//         const invoiceId = paymentIntent.invoice as string;

//         // 从 invoice 里拿到 metadata（防止错过信息）
//         const invoice = await this.stripeService.retrieveInvoice(invoiceId);
//         const { companyId, planId } = invoice.metadata || {};

//         if (!companyId || !planId) {
//           this.logger.error('❌ Missing metadata in invoice');
//           return res.status(400).send('Missing metadata');
//         }

//         try {
//           await this.subscriptionService.activateSubscription(
//             companyId,
//             planId,
//             paymentIntentId,
//           );
//           this.logger.log(
//             `✅ Subscription activated for companyId=${companyId}, planId=${planId}`
//           );
//         } catch (error: any) {
//           this.logger.error(
//             '❌ Error activating subscription:',
//             error.message,
//           );
//         }

//         break;
//       }

//       default:
//         this.logger.warn(`Unhandled event type ${event.type}`);
//     }

//     return res.send('ok');
//   }
// }
