import { Router } from "express";
import {fetchProfileDetails ,setCryptoAddress, updateProfileDetails ,updatedPassword ,uploadProfilePic, deleteProfile, transactionList } from "../controllers/web/Profile/profile.controller.js";
import {auth , isUser} from "../middlewares/auth.middleware.js";
import multer from "multer";
import { storage , fileFilter } from "../core/helpers/common.helpers.js";
import { createInvoiceLink, setTransDone} from "../controllers/web/Payments/payments.controller.js";
const upload = multer({ storage: storage , fileFilter: fileFilter}).array('file', 1);

const router = Router();

router.get('/details' , auth  , isUser, fetchProfileDetails);
router.get("/transaction-list" , auth , isUser , transactionList);



router.post('/update', auth  , isUser, updateProfileDetails );
router.post('/upload-pic' ,auth  , isUser,upload ,  uploadProfilePic);
router.post('/change-password' ,auth  , isUser, updatedPassword);
router.post("/set-crypto-id" , auth ,isUser , setCryptoAddress);
router.post("/bet" ,auth, createInvoiceLink);
router.post("/set-trans-done" , auth , setTransDone);



router.delete('/delete' ,auth  , isUser, deleteProfile);




export { router as userRoutes };