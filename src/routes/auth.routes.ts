import { Router } from "express";
import {userSignup , sendSignUpOtp, login} from "../controllers/web/Auth/auth.controller.js"
const router = Router();

router.post("/sign-up", userSignup);
router.post("/login", login);
router.post("/send-otp", sendSignUpOtp);

export { router as authRoutes };