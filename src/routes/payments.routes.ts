import { Router } from "express";
import { passimpayWebhookHandler } from "../controllers/web/Payments/payments.controller.js";
const router = Router();

router.post("/payment-notification" , passimpayWebhookHandler);


export  { router as paymentRoutes }