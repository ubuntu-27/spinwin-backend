import axios from "axios";
import crypto from "crypto";
import { config } from 'dotenv';
import { Response  , Request} from "express";
import {Transaction} from "../../../models/transaction.schema.js";
import {WheelGame} from "../../../models/wheelGame.schema.js";
import {  Schema } from "mongoose";


config();
const  apiUrl = 'https://api.passimpay.io';

 const createInvoiceLink = async (req : Request  , res : Response ) : Promise<any>  => 
{
    try
    {

        let  { amount , game_id , item } = req.body;
        // amount = parseFloat(amount );
        // amount.toFixed(2);

        //pending condition for already betted item 

        const userTokenDetails = JSON.parse(req.headers['x-user'] as string);

        const gameDetails = await WheelGame.findById(game_id);

        if(!gameDetails || gameDetails?.status == 'completed')
        {
            return res.status(400).json({
                status : false ,
                message : "game does not exits"
            })
        }
        let flag = false ;
        gameDetails.bets?.length && gameDetails.bets.forEach( ( obj : any ) => 
        {
            // item.id == JSON.parse(obj.item).id &&
            if( userTokenDetails.id == obj.userId)
            {
               flag=true;
               return ;
            }
        });
        if(flag)
        {
            return res.status(400).json({
                status : false ,
                message : "Bet was already placed !"
            })
        }


        console.log(amount  , item, " amount to be bet on the item ");
        
        const transPayload = { 
            userId : userTokenDetails.id ,
            gameId :game_id,
            type : 'bet',
            amount : amount,
            item : JSON.stringify(item),
        }
        let transaction = await Transaction.create(transPayload);
        
        const bodyJson = JSON.stringify({
            platformId :process.env.PASSIMPAY_PLATFORM_ID,
            amount : amount,
            currencies : "ERC20,Arbitrum,BEP20",
            type : 0,
            orderId  : transaction._id,
            symbol : "USD",
           }); // Convert body to JSON string

        const signatureContract = `${process.env.PASSIMPAY_PLATFORM_ID};${bodyJson};${process.env.PASSIMPAY_API_KEY}`;
        const signature = await generateSignature(signatureContract, `${process.env.PASSIMPAY_API_KEY}`); // Generate signature

        console.log(signatureContract , "\n" , signature)
        const instance = axios.create({
            baseURL : apiUrl,
            headers : 
            {
               "x-signature"  : signature,
               "Content-Type" : "application/json"
            },

        });

        let responsePassimpay = await instance.post('/v2/createorder' , bodyJson);
        // .then((resp:any) => {
        //     console.log(resp.data , " api respone from passimpay")
        //     if(resp.result == 0)
        //         {
        //             return res.status(400).json({
        //                 success : false , 
        //                 message : "Something went wrong !"
        //             })
        //         }
        //         else if (resp.result == 1 )
        //         {
                    
                    
        //         }
        //  }).catch((err) => {console.error(err);return res.status(400).json({
        //     success : false , 
        //     message : "Something went wrong !"
        // })});
        console.log(responsePassimpay.data, " pass im pay response here ")
        return res.status(200).json(
            {
                success : true , 
                data : JSON.parse(JSON.stringify(responsePassimpay.data)),
                trans_id : transaction?._id,
                message : "payment link."
            });

    }
    catch(error)
    {
        console.log(error);
        return res.status(500).json(
            {
                success:false, 
                message:"Something went wrong. Please try again",
              
            }
        )
    }
}

export const setTransDone = async ( req : Request , res : Response )  : Promise<any> => 
{
    try
    {
        const { transactionId } = req.body;
        const transDetails = await Transaction.findByIdAndUpdate({_id : transactionId , status : 'pending'} , {  status : 'completed'} , { new : true });
        let userId = transDetails?.userId;
        const gameDetails = await WheelGame.findById(transDetails?.gameId);
        const result = await WheelGame.findByIdAndUpdate({ _id : transDetails?.gameId} , {
            $push : { 
                users : userId,
                bets : { 
                    userId: transDetails?.userId, 
                    amount: transDetails?.amount, 
                    item: transDetails?.item, 
                    transaction_id : transDetails?._id,
                    round_count : gameDetails?.round
                }
            }
         } , { new  : true });

        return res.status(200).json(
            {
                success : true , 
                data : transDetails,
                message : "transaction verified."
            });
    }
    catch(error)
    {
        console.log(error);
        return res.status(500).json(
            {
                success:false, 
                message:"Something went wrong. Please try again",
              
            }
        )
    }
}


const passimpayWebhookHandler = async ( req :Request, res : Response) : Promise<any> => 
{
    try
    {
        console.log("-----webhook envoked -----")
        console.log(req.body);
        const body = req.body;
        let bodyJson =JSON.stringify(body);

        const signatureContract = `${process.env.PASSIMPAY_PLATFORM_ID};${bodyJson};${process.env.PASSIMPAY_API_KEY}`;
        const signature = await generateSignature(signatureContract, `${process.env.PASSIMPAY_API_KEY}`); // Generate signature
        let received_signature = req.headers['x-signature']

        if(received_signature == signature)
        {
            console.log("Signature matched ");
            const transDetails = await Transaction.findByIdAndUpdate({_id : body.orderId , status : 'pending'} , { payment_id : body.paymentId , txhash : body.txhash , addressFrom : body.addressFrom , addressTo : body.addressTo , crypto_confirmations : body.confirmations , destinationTag : body.destinationTag , status : 'completed' , currency : body.currency});
            const gameDetails = await WheelGame.findById(transDetails?.gameId);
            await WheelGame.findByIdAndUpdate({ _id : transDetails?.gameId} , { $push : {  bets : { userId: transDetails?.userId, 
                amount: transDetails?.amount, 
                item: transDetails?.item, 
                transaction_id : transDetails?._id,
                users : transDetails?.userId ,
                round_count : gameDetails?.round
            } }});

            return res.status(200);
        }
        else 
        {
            console.log("Signature matched ");
            return res.status(400)
        }

    }
    catch(error)
    {
        console.log(error);
        return res.status(500).json(
            {
                success:false, 
                message:"Something went wrong. Please try again",
              
            }
        )
    }
}

const checkInvoice = async (req : Request , res : Response) : Promise<any> => 
{
    try
    {
        let { trans_id } = req.body;
        let bodyJson =JSON.stringify({ orderId : trans_id , platformId : process.env.PASSIMPAY_PLATFORM_ID});
        const signatureContract = `${process.env.PASSIMPAY_PLATFORM_ID};${bodyJson};${process.env.PASSIMPAY_API_KEY}`;
        const signature = await generateSignature(signatureContract, `${process.env.PASSIMPAY_API_KEY}`); // Generate signature
        const instance = axios.create({
            baseURL : apiUrl,
            headers : 
            {
               "x-signature"  : signature,
               "Content-Type" : "application/json"
            },

        });


        await instance.post('/v2/orderstatus' , bodyJson).then((resp:any) => {
            console.log(resp.data , " api respone from passimpay")
            if(resp.result == 0)
                {
                    return res.status(400).json({
                        success : false , 
                        message : "Something went wrong !"
                    })
                }
                else if (resp.result == 1 )
                {
                    
                    return res.status(200).json(
                    {
                        success : true , 
                        data : resp,
                        message : "fetched invoice details."
                    });
                }
         }).catch((err) => console.error(err));
    }
    catch(error)
    {
        console.log(error);
        return res.status(500).json(
            {
                success:false, 
                message:"Something went wrong. Please try again",
              
            }
        )
    }
}



async function generateSignature(signatureContract : any , secret : any ) {
    return await crypto.createHmac("sha256", secret)
                 .update(signatureContract)
                 .digest("hex");
}



export { createInvoiceLink  , passimpayWebhookHandler};