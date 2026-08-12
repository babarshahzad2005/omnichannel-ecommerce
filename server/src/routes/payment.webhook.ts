import { Router } from "express";
import { handleWebhookHandler } from "../controllers/payment.controller";

const router = Router();

router.post("/", handleWebhookHandler);

export default router;
