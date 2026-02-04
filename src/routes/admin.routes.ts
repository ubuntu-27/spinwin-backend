import { Router } from "express";
import {addAdmin, dashboardCounts, login, setUserStatus, userList} from "../controllers/admin/user/user.controller.js"
import {createGame , gameList, getWinnersList, spinTheWheel} from "../controllers/admin/wheel-game/wheel-game.controller.js"
import { auth, isAdmin } from "../middlewares/auth.middleware.js";
import { transactionListing , payToWinningUser, approveTransaction, addPayoutTransaction} from "../controllers/admin/payments/payments.controller.js";
const router = Router();

// game routes 
router.get("/fetch-winners/:id" , getWinnersList);

// users routes 
router.get("/users/list" ,auth ,  isAdmin , userList);
router.post("/users/set-status" , auth , isAdmin , setUserStatus);

//auth routes
router.post("/login", login);
router.post("/create" , addAdmin);

//game routes 
router.post("/create-game" ,auth,isAdmin ,createGame);
router.post("/spin-wheel", auth ,isAdmin, spinTheWheel);
router.get("/game-list" , auth ,isAdmin, gameList); 

// transaction routes 
router.get("/transaction-list" , auth , isAdmin,transactionListing);
router.post("/pay-to-winners" , auth , isAdmin , payToWinningUser);
router.post("/approve-trans/:id" , auth , isAdmin , approveTransaction);
router.post("/add-payout" , auth , isAdmin , addPayoutTransaction);

//dashcounts 
router.get("/dash-count" , dashboardCounts);

export { router as adminRoutes };