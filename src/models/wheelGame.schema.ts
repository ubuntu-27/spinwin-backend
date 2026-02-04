import { model, Schema } from "mongoose";

const WheelGameSchema = new Schema({
  name : { type : String , trim : true},
  items: [
    {
      name: String,
      odds: Number, 
    },
  ],
  bets: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User" }, 
      amount: { type: Number, required: true }, 
      item:  { type : Object } , 
      transaction_id : { type: Schema.Types.ObjectId, ref: "Transaction" },
      round_count : { type : Number , default : 1}
    },
  ],
  winners: [{
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null }, 
    item: { type : Object }, 
    amountWon: { type: Number, default: 0 }, 
  }],
  status: { type: String, enum: ["pending", "completed"], default: "pending" }, 
  round : { type : Number , default : 1},
  is_settled_winning_price : { type : Boolean , default : false },
  users : [{ type : Schema.Types.ObjectId , ref : "User"}],
  winning_items : [{ type : Object }]
  
},{ timestamps : true });


const WheelGame =  model('WheelGame' , WheelGameSchema);

export {WheelGame , WheelGameSchema };