import { Router } from "express";
import  {authRoutes}  from "./auth.routes.js";
import {userRoutes} from "./user.routes.js";
import { adminRoutes } from "./admin.routes.js";
import {gameRoutes} from "./game.routes.js"
import { paymentRoutes } from "./payments.routes.js";
const router = Router();

router.use('/auth' , authRoutes);
router.use('/user' , userRoutes);
router.use("/admin" , adminRoutes );
router.use("/game" , gameRoutes);
router.use("/payments" , paymentRoutes )

export { router as routeIndex};