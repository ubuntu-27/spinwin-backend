import { Request , Response } from "express";
import { Transaction } from "../../../models/transaction.schema.js";
import { WheelGame } from "../../../models/wheelGame.schema.js";
import axios from "axios";
import { config } from 'dotenv';
import crypto from "crypto";
import { User } from "../../../models/user.schema.js";

config();
const  apiUrl = 'https://api.passimpay.io/v2/withdraw';

export const transactionListing = async ( req: Request , res : Response ) :Promise<any> =>
{
    try
    {
        const {  status  } = req.query;

        let page = req.query.page ? parseInt(req.query.page.toString()) : 0;
        let limit = req.query.limit ? parseInt(req.query.limit.toString()) : 10;
        let skip = (page - 1) * (limit);
        let filteredQuery:any={};
        if(status != '' && status != undefined && status != null)
        {
            filteredQuery['status'] = status;
        }
        const [records , count ] = await Promise.all([
            await Transaction.aggregate([
                {
                    $match : filteredQuery
                },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
                { 
                    $lookup : {
                        from : 'users',
                        localField : 'userId',
                        foreignField : '_id',
                        as : 'user_details'
                    }
                },
                { $unwind : { path : '$user_details' , preserveNullAndEmptyArrays : true }},
                { 
                    $lookup : {
                        from : 'wheelgames',
                        localField : 'gameId',
                        foreignField : '_id',
                        as : 'game_details'
                    }
                },
                { $unwind : { path : '$game_details' , preserveNullAndEmptyArrays : true }},
            ]),
            await Transaction.countDocuments(filteredQuery)
        ]);
        return res.status(200).json({
            success : true , 
            message  :"transaction list fetched.",
            data : { records , count}
        });
    }
    catch(error)
    {
        console.log(error);
        return res.status(500).json(
            {
                success:false, 
                message:"Something went wrong !",
                
            }
        )
    }
}

export const payToWinningUser =  async ( req: Request , res : Response ) :Promise<any> =>
{
    try
    {
        const { game_id } = req.body;
        const gameDetails = await WheelGame.findById(game_id);
        if(gameDetails?.['status'] == 'pending')
        {
        return res.status(400).json({
            status : false ,
            message : "Game is not completed yet !"
        })
        }

        const total_bet_winning_number = getTotalBetOnWinningItem(gameDetails);

        let winnerArray = gameDetails?.['winners'];
        console.log(winnerArray , " winners array ");
        let winningItem = winnerArray?.length ? winnerArray?.[0].item: null;
        let totalPoolAmount = winnerArray?.length ? winnerArray?.[0].amountWon: 0;


        const price_to_pay_user_map :any= {};
        winnerArray?.length && winnerArray?.forEach( async (el) => 
            {
                let user_bet_amount = getUserBet(gameDetails , winningItem , el.userId);
                console.log(user_bet_amount , total_bet_winning_number , totalPoolAmount);
                
                if(user_bet_amount && total_bet_winning_number &&  totalPoolAmount)
                {
                    price_to_pay_user_map[el.userId.toString()] =  user_bet_amount / total_bet_winning_number * totalPoolAmount;
                }
            });

        let keys = Object.keys(price_to_pay_user_map);
        console.log(keys)
        let responses = [];

        for(let i = 0 ; i <=keys.length-1;i++)
        {
            const userDetails = await User.findById(keys[i]);
            console.log(userDetails)
            if(userDetails?.crypto_address)
            {
                let trans = await Transaction.findOne({ gameId : gameDetails?._id , userId : userDetails?._id});
                let resp = await sendCoinsToWinners( userDetails?.crypto_address , trans?.currency ? trans?.currency :  'TRX' , price_to_pay_user_map[keys[i]] , keys[i]);
                responses.push(resp);
            }
        }

        await WheelGame.findByIdAndUpdate({ _id : game_id } , {is_settled_winning_price : true  });


        return res.status(200).json({
            status : true ,
            message : "",
            data : responses
        });
    }
    catch(error)
    {
        console.log(error);
        return res.status(500).json(
            {
                success:false, 
                message:"Something went wrong !",
                
            }
        )
    }
}


export const approveTransaction = async ( req : Request , res : Response ) : Promise<any> => {
    try
    {
        const { id } = req.params;
        await Transaction.findByIdAndUpdate( { _id : id } , { adminApproved : true } , { new : true });
        return  res.status(200).json(
            {
                success:true, 
                message:"Transaction approved.",
                
            }
        )
    }
    catch(error)
    {
        console.log(error);
        return res.status(500).json(
            {
                success:false, 
                message:"Something went wrong !",
                
            }
        )
    }

}


export const addPayoutTransaction = async ( req : Request , res : Response ) : Promise<any> => 
{
    try
    {
        const {  userId , 
        gameId , 
        type = 'payout',
        amount , 
        status = "completed",
        adminApproved = true , 
        payment_id ,
        addressFrom  , 
        addressTo  , 
        crypto_confirmations  , 
        destinationTag , currency } = req.body;

        const trans = await Transaction.create({  userId , 
            gameId , 
            type ,
            amount , 
            status ,
            adminApproved  , 
            payment_id ,
            addressFrom  , 
            addressTo  , 
            crypto_confirmations  , 
            destinationTag ,
            currency });


        return res.status(200).json(
            {
                success:true, 
                message:"Payout added successfully.",
                data : trans
            }
        )
    }
    catch(error)
    {
        console.log(error);
        return res.status(500).json(
            {
                success:false, 
                message:"Something went wrong !",
                
            }
        )
    }
}

function getUserBet( gameDetails : any  , winningItem : any , userId : any)
{
    try
    {   
        const betsArr = gameDetails.bets;
        let amount = 0;

        betsArr?.forEach( (bet:any) => 
        {
                console.log(JSON.parse(bet.item)._id == winningItem._id.toString() , bet.round_count == 2 , bet.userId.toString() == userId.toString())
                if(JSON.parse(bet.item)._id == winningItem._id.toString() && bet.round_count == 2 && bet.userId.toString() == userId.toString())
                {
                    console.log(bet.amount)
                     amount = bet.amount;
                }
            });
        return amount;

    }
    catch(error)
    {
        // throw new Error(error);
    }
}

function getTotalBetOnWinningItem( gameDetails : any ) 
{
    try
    {
        let winnerArray = gameDetails?.['winners'];
        console.log(winnerArray , " winners array ");
        let winningItem = winnerArray.length ? winnerArray[0].item: null;
        console.log("winning item ---->" , winningItem , );

        let totalAmount = 0;
        gameDetails?.bets.length && gameDetails?.bets.forEach(( bet : any) => 
        {
            if(JSON.parse(bet.item)._id == winningItem._id  && bet.round_count == 2 )
            {
                totalAmount = totalAmount + bet.amount;
            }
        });

        console.log("total bet amount on winning item ---> " , totalAmount);

        return totalAmount;

    }
    catch(error)
    {
        //  throw new Error(error);
        console.log(error)
    }
}

async function sendCoinsToWinners(wallet_address : any , currency : any , amount:any , userId : any )
{

    if (!wallet_address || !currency || !amount) {
        return;
    }

    console.log(wallet_address , currency , amount)

    
    try {

        const paymentId = Date.now() + " " + Math.random(); 
        let bodyJson =JSON.stringify({ addressTo : wallet_address  , amount :  0.01  , paymentId : paymentId,  currency: currency, platformId : process.env.PASSIMPAY_PLATFORM_ID});
        const signatureContract = `${process.env.PASSIMPAY_PLATFORM_ID};${bodyJson};${process.env.PASSIMPAY_API_KEY}`;
        const signature = await generateSignature(signatureContract, `${process.env.PASSIMPAY_API_KEY}`); // Generate signature
        console.log(signature , " xxxxxxxxxxxx signature xxxxxxxx");

        let response = await axios.post(apiUrl, { addressTo : wallet_address  , amount :  0.01  , paymentId: paymentId , currency : currency, platformId : process.env.PASSIMPAY_PLATFORM_ID}, {
        headers: 
            {
                "x-signature"  : signature,
                "Content-Type" : "application/json"
            },
        });

       if(response.data.result == 1)
       {
         await Transaction.create({ userId : userId , amount : amount , type : "payout" , adminApproved : true  , payment_id : paymentId , addressTo :  wallet_address});
       }

        console.log(response.data , " response here ")
        return response.data;

    } catch (error) {
        // console.error('Payment Error:', error.response?.data || error.message);
    }

}


async function generateSignature(signatureContract : any , secret : any ) {
    return await crypto.createHmac("sha256", secret)
                 .update(signatureContract)
                 .digest("hex");
}




