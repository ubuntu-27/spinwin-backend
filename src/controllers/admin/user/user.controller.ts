
import { Request, Response } from "express";
import {User} from "../../../models/user.schema.js";
import { config } from 'dotenv';
import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Transaction } from "../../../models/transaction.schema.js";
import { WheelGame } from "../../../models/wheelGame.schema.js";
config();


export const login = async (req : Request, res : Response):Promise<any> =>
    {
        try{
    
            const {email , password} = req.body;
    
            //validate password
            if(!password || !email)
            {
                return res.status(401).json({
                    success:false,
                    message: "All fields are required",
                })
            }
    
            //check user already exist or not 
            const user = await User.findOne({email : new RegExp(`^${email}$`, 'i')});

            if(!user)
            {
                return res.status(400).json({
                    success:false,
                    message : "User is not registered . Please sign-up",
                })
            }

            if(user.role != "Admin")
                {
                    return res.status(400).json({
                        success:false,
                        message : "User is not valid !",
                    })
                }
    
            //match password
            if( await bcrypt.compare(password , user.password))
            {
                const payload = {
                    email : user.email,
                    id : user._id,
                    accountType : user.role
                }
                let secret =process.env.JWT_SECRET || 'SpinWin123';
                const token :any= await jsonwebtoken.sign(payload ,secret , {});
                let responseData:any = user;
                responseData = { ...responseData._doc , token:token};
                delete responseData['password'];
    
                const options = {
                    httpOnly : true
                }
    
                //create cookie and send response 
                res.cookie("token" , token , options).status(200).json({
                    success:true,
                    data : responseData,
                    message: 'Logged in successfully '
                })
            }
            else
            {
                return res.status(401).json({
                    success:false,
                    message:"Password is Incorrect"
                })
            }
    
        }
        catch(error)
        {
            console.log(error);
            return res.status(500).json(
                {
                    success:false, 
                    message:"Login Failure. Please try again",
                  
                }
            )
        }
    }

export const userList = async (req : Request, res : Response):Promise<any> =>
{
    try
    {
        const filteredQuery = { role : "User" , is_deleted : false , is_active : true , is_email_verified : true };
        let page = req.query.page ? parseInt(req.query.page.toString()) : 0;
        let limit = req.query.limit ? parseInt(req.query.limit.toString()) : 10;
        let skip = (page - 1) * (limit);
        skip = skip ? parseInt(skip.toString()) : 0;
        const [user , count ] = await Promise.all([
            await User.aggregate([
                {
                    $match:filteredQuery
                },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
            ]),
            await User.countDocuments(filteredQuery),
        ]);
        return res.status(200).json(
            {
                success:true, 
                data : {list : user , count : count },
                message:"List fetched successfully.",
            }
        )
    }
    catch(error)
    {
        console.log(error);
        return res.status(500).json(
            {
                success:false, 
                data : [],
                message:"Something went wrong !",
            }
        )
    }
}

export const setUserStatus = async (req : Request, res : Response):Promise<any> => 
{
    try
    {
        const { user_id , status  } = req.body;
        await User.findByIdAndUpdate({_id : user_id } , { is_active : status });
        return res.status(200).json(
            {
                success:true, 
                data : [],
                message:"Updated successfully.",
            }
        )
    }
    catch(error)
    {
        console.log(error);
        return res.status(500).json(
            {
                success:false, 
                data : [],
                message:"Something went wrong !",
            }
        )
    }
}

export const addAdmin =async ( req: Request , res : Response ) : Promise<any> => 
{
    try
    {
        const { username , password  , email  } = req.body;
        
        const userExist = await User.findOne({email : new RegExp(`^${email}$`, 'i')});
        if(userExist)
        {
            return res.status(400).json({ 
                success : false , 
                data : [],
                message : 'Email is already registered !'
            })
        }

        
        
        const hashPassword = await bcrypt.hash(password , 10);
        
        
        const userDetails = await User.create({ 
            username ,
            password : hashPassword,
            profile_pic : { Location : `https://api.dicebear.com/5.x/initials/svg?seed=${username}`,},
            gender : "Male" ,
            email ,
            phone_number : "123456789",
            is_email_verified : true ,
            is_active : true ,
            role : "Admin" 
            });
            
        return res.status(201).json({ 
            success : true , 
            data : userDetails,
            message : 'Information saved successfully.'
        })
    }
    catch(error)
    {
        console.log(error);
        return res.status(500).json(
            {
                success:false, 
                data : [],
                message:"Something went wrong !",
            }
        )
    }
}



export const dashboardCounts = async ( req : Request , res : Response):Promise<any> => 
{
    try
    {
        const totalUserCount = await User.countDocuments({is_email_verified : true , is_active : true , role : "User" });
        const totalBetsAmount = (await Transaction.aggregate([
            {
                $match: {
                  type: "bet",
                  status : "completed"
                }
              },
              {
                $group: {
                  _id: null,
                  totalAmount: { $sum: "$amount" }
                }
              }
          ]))[0]?.totalAmount || 0.00;
        const totalGamesCount = await WheelGame.countDocuments({});
        const totalPayoutsAmount = (await Transaction.aggregate([
                {
                    $match: {
                      type: "payout", 
                      status : "completed"
                    }
                },
                {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" }
                }
                }
          ]))[0]?.totalAmount || 0.00;

          res.status(200).json({
            status : true ,
            message : "dash counts",
            data : { totalPayoutsAmount , totalBetsAmount , totalGamesCount , totalUserCount}
          })
    }
    catch(error)
    {
        console.log(error)
        return res.status(500).json(
            {
                success:false, 
                message:"Something went wrong !",
                
            }
        )
    }
}