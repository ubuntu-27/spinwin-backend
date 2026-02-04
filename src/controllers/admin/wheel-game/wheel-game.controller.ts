import { Request, Response } from "express";
import { WheelGame } from "../../../models/wheelGame.schema.js";
import {User} from "../../../models/user.schema.js";
import mongoose from "mongoose";

export const createGame = async ( req : Request, res : Response) : Promise<any> => 
{
    try
    {
        let { items , name  }  = req.body ; 

        if(!items || !items.length)
        {
            items = [{name : 1 , odds : 1},{name : 2, odds : 2},{name : 3, odds : 3},{name : 4 , odds : 4},{name : 5, odds : 5},{name : 6, odds : 6},{name : 7 , odds : 7},{name : 8 , odds : 8},{name : 9 , odds : 9}];
        }

        const game = await WheelGame.create({ items : items , name : name  });
        return res.status(200).json(
            {
                success:true,
                data :  game,
                message:"created successfully.",
                
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


export const spinTheWheel = async ( req : Request ,res : Response) : Promise<any> => 
{ 
    try
    {
        const { game_id } = req.body;
        const gameDetails = await WheelGame.findById({_id : game_id});
        if(!gameDetails)
        {
            return res.status(400).json({
                status : false,
                message : "Invalid game !"
            })
        }
        // let lengthOfItems =  gameDetails?.items?.length ?  (gameDetails?.items.length || 0) - 1  : 0;
        
        let winningItem = gameDetails?.items[Math.floor(Math.random() * (gameDetails?.items.length-1))];
        // let winningItem = {
        //     "name": "1",
        //     "odds": 1,
        //     "_id": "68176b16481d94f2adc54919"
        // }
        

        if(gameDetails.round ==1)
        {
            await settleRound1(gameDetails , winningItem)
        }
        else if(gameDetails.round == 2)
        {
            await settleRound2(gameDetails , winningItem)
        }

        
        
        return res.status(200).json({
            success : true ,
            data : {winningItem },
            message : "Winning item of the game."
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

async function settleRound1(gameDetails : any , winningItem : any ):Promise<any>
{
    try
    {

        let winners : any[] = []
        gameDetails?.bets.length && gameDetails?.bets.forEach(( bet : any) => 
        {
            
            if(JSON.parse(bet.item)._id == winningItem?._id && bet.round_count == 1)
            {
                let userBetObj =bet;
                winners.push({userId: userBetObj.userId , item : winningItem , amountWon : userBetObj.amount * 5 });
                
            }
        });
        let winnersUserId : any[] = [];
        winners.length && winners.forEach( el => {console.log(el.userId); winnersUserId.push(el.userId.toString()) });
        winningItem['round'] = gameDetails.round;
        let details = await WheelGame.findByIdAndUpdate({_id : gameDetails._id } , { $inc : { round : 1} , winners: winners , $push : { winning_items : winningItem } } , { new : true });
        console.log( winningItem  , details?.winning_items , "----------- here -------------")
    }
    catch(error:any)
    {
        throw new Error(error);
    }
}

async function settleRound2(gameDetails : any  , winningItem : any ) :Promise<any>
{
    try
    {
        let winners : any[] = [];
        gameDetails?.bets.length && gameDetails?.bets.forEach(( bet : any) => 
        {
            if(JSON.parse(bet.item)._id == winningItem?._id && bet.round_count == 2)
            {
                let userBetObj = bet;
                winners.push({userId: userBetObj.userId , item : winningItem , amountWon : userBetObj.amount * 25 });
                
            }
            else if(JSON.parse(bet.item)._id != winningItem?._id && bet.round_count == 2)
            {
                let userBetObj = bet;
                winnersUserId.push(userBetObj.userId);
                
            }
        });

        let winnersUserId : any[] = [];
        winners.length && winners.forEach( el => {console.log(el.userId); winnersUserId.push(el.userId.toString()) });
        await WheelGame.findByIdAndUpdate({_id : gameDetails._id } , {  $pull :  { winners : { userId: { $in: winnersUserId } } } }  , { new : true });
        winningItem['round'] = gameDetails.round;
        let details = await WheelGame.findByIdAndUpdate({_id : gameDetails._id } , {  status : 'completed' ,$push: {
            winners: {
              $each: winners
            },
            winning_items : winningItem 
          }  } , { new : true });

          console.log( winningItem  , details?.winning_items , "----------- here -------------")
    }
    catch(error:any)
    {
        throw new Error(error);
    }
}


export const gameList = async ( req : Request , res : Response): Promise<any> => 
{
    try
    {
        const { status } = req.query;
        let page = req.query.page ? parseInt(req.query.page.toString()) : 0;
        let limit = req.query.limit ? parseInt(req.query.limit.toString()) : 10;
        let skip = (page - 1) * (limit);
        const userTokenDetails = JSON.parse(req.headers['x-user'] as string);
        let filteredQuery:any = {};
        if(status!= '' && status != undefined && status != null)
        {
            filteredQuery['status'] = status;
        }
        const [ records  , count  ] = await Promise.all([
            WheelGame.aggregate([
                {
                    $match: filteredQuery,  
                },
                {
                    $sort : { createdAt : -1} 
                },
                {
                $skip: skip,  
                },
                {
                $limit: limit,  
                },
                // Step 1: Unwind bets
                { $unwind: { path: "$bets", preserveNullAndEmptyArrays: true } },

                // Step 2: Lookup user details for each bet
                {
                    $lookup: {
                    from: "users",
                    localField: "bets.userId",
                    foreignField: "_id",
                    as: "userDetails"
                    }
                },
                { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },

                // Step 3: Lookup transaction details
                {
                    $lookup: {
                    from: "transactions",
                    localField: "bets.transaction_id",
                    foreignField: "_id",
                    as: "transactionDetails"
                    }
                },
                { $unwind: { path: "$transactionDetails", preserveNullAndEmptyArrays: true } },

                // Step 4: Rebuild enriched bet entry
                {
                    $addFields: {
                    "bets.userDetails": "$userDetails",
                    "bets.transactionDetails": "$transactionDetails"
                    }
                },
            ]),
            WheelGame.find(filteredQuery).countDocuments(filteredQuery)
        ]);

        return res.status(200).json({
            success : false , 
            message : "Games fetched successfully.",
            data : { records : records , count : count}
        })
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

export const getWinnersList = async ( req : Request , res : Response ) : Promise <any> => 
{
    try
    {
        let filteredQuery:any = {};

        const [ records  , count  ] = await Promise.all([
            WheelGame.aggregate([
                {
                    $match : filteredQuery
                },
                { $unwind: "$winners" },
            ]),
            WheelGame.find(filteredQuery).countDocuments()
        ]);

        return res.status(200).json({
            success : false , 
            message : "Game winners fetched successfully.",
            data : { records : records , count : count}
        })
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