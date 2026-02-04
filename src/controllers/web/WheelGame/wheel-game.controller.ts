import { WheelGame } from "../../../models/wheelGame.schema.js";
import { User } from "../../../models/user.schema.js";
import { Request ,Response} from "express";
import  Mongoose, { Schema } from "mongoose";
import mongoose from "mongoose";

export const gameList = async ( req : Request , res : Response): Promise<any> => 
{
    try
    {
        const userTokenDetails = JSON.parse(req.headers['x-user'] as string);
        let filteredQuery:any = {};
        filteredQuery['$or'] = [{ '$and' :[ { round : 1 }, {status : 'pending'}]} , { '$and' : [{ round : 2 }, {users : new mongoose.Types.ObjectId(String(userTokenDetails.id))}] }]
        const [ records  , count  ] = await Promise.all([
            WheelGame.aggregate([
                {
                    $match : filteredQuery
                },
                {
                    $addFields: {
                      userBets: {
                        $filter: {
                          input: "$bets",
                          as: "bet",
                          cond: { $eq: ["$$bet.userId", new mongoose.Types.ObjectId(String(userTokenDetails.id))] } // only keep bets where userId exists
                        }
                      }
                    }
                  },
            ]),
            WheelGame.find(filteredQuery).countDocuments()
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


export const gameDetails = async ( req : Request , res : Response ) : Promise<any> => 
{
    try
    {
        const { id } = req.params;

        const userTokenDetails = JSON.parse(req.headers['x-user'] as string);
        let filteredQuery:any = {};
        filteredQuery['_id'] = new mongoose.Types.ObjectId(id);
        // filteredQuery['status'] = 'pending'
        filteredQuery['$or'] = [{ round : 1 } , { '$and' : [{ round : 2 }, {users : new mongoose.Types.ObjectId(String(userTokenDetails.id))}] }]
        
        const [ records  , count  ] = await Promise.all([
            WheelGame.aggregate([
                {
                    $match : filteredQuery
                }
            ]),
            WheelGame.find(filteredQuery).countDocuments()
        ]);
        return res.status(200).json({
            success : false , 
            message : "Game fetched successfully.",
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


export const enterFinalRound = async ( req : Request , res : Response ) : Promise<any>  => 
{
    try
    {
        const { game_id , item } = req.body;

        const userTokenDetails = JSON.parse(req.headers['x-user'] as string);
        const gameDetails = await WheelGame.findById(game_id);

        if(!gameDetails || gameDetails?.status == 'completed' || gameDetails.round !=2)
        {
            return res.status(400).json({
                status : false ,
                message : "game does not exits"
            })
        }
        let bet :any ;

        let flag:any = false;

        gameDetails.bets?.length && gameDetails.bets.forEach( ( obj : any ) => 
            {
                // item.id == JSON.parse(obj.item).id &&
                if( userTokenDetails.id == obj.userId && obj.round_count == 2)
                {
                   flag = obj ;
                }
            });
        if(flag)
        {
            return res.status(400).json({
                status : false ,
                message : "Final round bet is alredy placed !",
                data : flag
            })
        }
        gameDetails.bets?.length && gameDetails.bets.forEach( ( obj : any ) => 
        {
            // item.id == JSON.parse(obj.item).id &&
            if( userTokenDetails.id == obj.userId)
            {
                bet = obj;
                bet['item']=JSON.stringify(item);
                bet['round_count'] = gameDetails.round;
                return ;
            }
        });


        await WheelGame.findByIdAndUpdate({_id : game_id } , { $push : { bets : bet }} , { new : true });

      
        return res.status(200).json({
            success : true , 
            message : "Entered final round !"
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