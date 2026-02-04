import { gameList ,enterFinalRound, gameDetails} from "../controllers/web/WheelGame/wheel-game.controller.js"
import { Router } from 'express';
import { auth } from "../middlewares/auth.middleware.js";
const router = Router();

router.get("/fetch-games" , auth , gameList);
router.get("/:id", auth , gameDetails);
router.post("/enter-final-round" ,auth, enterFinalRound);

export { router as gameRoutes };