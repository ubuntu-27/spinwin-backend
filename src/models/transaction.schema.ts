
import { model ,Schema } from 'mongoose';

const TransactionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // User associated with the transaction
    gameId: { type: Schema.Types.ObjectId, ref: "WheelGame", required: true }, // Associated game session
    type: { type: String, enum: ["bet", "win", "payout"], required: true }, // Type of transaction
    amount: { type: Number, required: true }, // Amount involved in the transaction
    status: { type: String, enum: ["pending", "completed"], default: "pending" }, // Transaction status
    adminApproved: { type: Boolean, default: false }, // Admin approval status for payouts
    payment_id : { type : String },
    txhash : { type : String },
    addressFrom : { type : String } , 
    addressTo : { type : String } , 
    crypto_confirmations : { type : String } , 
    destinationTag : { type : String } , 
    item : { type : Object },
    createdAt: { type: Date, default: Date.now },
    currency : { type : String }
  });
  
const Transaction = model('Transaction'  , TransactionSchema);

export { Transaction , TransactionSchema};