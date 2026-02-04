import { Request, Response } from "express";
import { userInterface } from "./profile.interface.js";
import {User} from "../../../models/user.schema.js";
import bcrypt from "bcrypt";
import { Transaction } from "../../../models/transaction.schema.js";
import mongoose from "mongoose";

export const fetchProfileDetails = async ( req : Request , res : Response):Promise<any> => 
{
    try
    {
        const id = JSON.parse(JSON.stringify(req.headers['x-user'])).id;
        const userHeader = req.headers['x-user'];
        const userTokenDetails = JSON.parse(userHeader as string);

		const userDetails = await User.findById(userTokenDetails.id , { password : 0});
		
		return res.status(200).json({
			success: true,
			message: "Profile data fetched successfully",
			data: userDetails,
		});
    }
    catch(error)
    {
        console.log(error)
        return res.status(500).json({ 
            success : false , 
            data : [],
            message : 'Something went wrong !'
        })
    }
}

export const updateProfileDetails = async ( req : Request , res : Response) : Promise<any> => 
{
    try
    {
        const { username , phone_number , gender  } = req.body;
        const userTokenDetails = JSON.parse(req.headers['x-user'] as string);
        const payload = {} as userInterface;
        username ? payload['username'] = username  : '';
        phone_number ? payload['phone_number'] = phone_number  : '';
        gender ? payload['gender'] = gender  : '';

        const updatedUser = await User.findByIdAndUpdate({ _id : userTokenDetails.id} , payload , { new : true });
        return res.status(200).json({
			success: true,
			message: "Profile data updated successfully",
			data: updatedUser,
		});

    }
    catch(error)
    {
        console.log(error)
        return res.status(500).json({ 
            success : false , 
            data : [],
            message : 'Something went wrong !'
        })
    }
}

export const updatedPassword = async ( req : Request , res : Response) : Promise<any> => 
    {
        try
        {
            const { new_password , confirm_password  , old_password  } = req.body;
            const userTokenDetails = JSON.parse(req.headers['x-user'] as string);
            if(!new_password && !confirm_password && !old_password)
            {
                return res.status(400).json({ 
                    success : false , 
                    data : [],
                    message : 'All fields are required !'
                });
            }

            const userDetails = await User.findOne({ _id : userTokenDetails.id , is_active : true });

            if(!userDetails)
            {
                return res.status(400).json({ 
                    success : false , 
                    data : [],
                    message : 'Account does not exist !'
                });
            }

            if(new_password != confirm_password)
            {
                return res.status(400).json({ 
                    success : false , 
                    data : [],
                    message : 'New password and Confirm password does not match !'
                });
            }

            if(await bcrypt.compare(old_password , userDetails.password ))
            {
                const hashPassword = await bcrypt.hash(new_password , 10);
                const updatedUser = await User.findByIdAndUpdate({ _id : userTokenDetails.id} , {password : hashPassword} , { new : true });
                return res.status(200).json({ 
                    success : true , 
                    data : [],
                    message : 'Password updated successfully.'
                });
            }
            else 
            {
                return res.status(400).json({ 
                    success : false , 
                    data : [],
                    message : 'Old password is not valid !'
                });
            }

    
        }
        catch(error)
        {
            console.log(error)
            return res.status(500).json({ 
                success : false , 
                data : [],
                message : 'Something went wrong !'
            })
        }
    }

export const deleteProfile = async ( req : Request , res : Response) : Promise<any> => 
{
    try
    {
        const userTokenDetails = JSON.parse(req.headers['x-user'] as string);
        const userDetails = await User.findById(userTokenDetails.id);
        if(!userDetails)
        {
            return res.status(400).json({ 
                success : false , 
                data : [],
                message : 'Account does not exist !'
            });
        }

        await User.findByIdAndUpdate({_id : userTokenDetails.id} ,  { is_deleted : true , is_active : false });
        return res.status(200).json({ 
            success : true , 
            data : [],
            message : 'Account deleted successfully.'
        });
    }
    catch(error)
    {
        console.log(error)
        return res.status(500).json({ 
            success : false , 
            data : [],
            message : 'Something went wrong !'
        })
    }
}

export const uploadProfilePic = async ( req: Request , res : Response):Promise<any> => 
{
    try 
    {
        const files = req.files as Array<any>;
        console.log(req.files);
        let file = files?.[0];
        const userTokenDetails = JSON.parse(req.headers['x-user'] as string);
        const updatedUser = await User.findByIdAndUpdate({_id : userTokenDetails.id} , {
            profile_pic : 
                { 
                    Location : process.env.MEDIA_BASE_URL+"/"+file.filename , 
                    filename : file.filename,
                    size : file.size,
                    original_name : file.originalname,
                    type : file.mimetype
                }
        } , {new : true } );

        return res.status(200).json({ 
            success : true , 
            data : updatedUser,
            message : 'Updated successfully.'
        })
    }
    catch(error)
    {
        console.log(error)
        return res.status(500).json({ 
            success : false , 
            data : [],
            message : 'Something went wrong !'
        })
    }
}

export const setCryptoAddress = async (  req : Request , res : Response ) : Promise<any> => 
{
    try
    {
        const { crypto_address } = req.body;
        const userTokenDetails = JSON.parse(req.headers['x-user'] as string);
        let details = await User.findByIdAndUpdate({ _id : userTokenDetails.id } , { crypto_address : crypto_address} , { new : true });
        return res.status(200).json({ 
            success : true , 
            data : details,
            message : 'Updated successfully.'
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

export const transactionList = async (  req : Request , res : Response ) : Promise<any> => 
    {
        try
        {
            const { limit = 10 , page = 1} = req.query;
            const userTokenDetails = JSON.parse(req.headers['x-user'] as string);
            const filteredQuery:any = { }
            filteredQuery['userId'] = new mongoose.Types.ObjectId(String(userTokenDetails.id));
            let skip = (parseInt(page.toString())) * parseInt(limit.toString());
            const [records , count ] = await Promise.all([
                await Transaction.aggregate([
                    {
                        $match : filteredQuery
                    },
                    { $sort : { creatdAt : -1}},
                    { $skip: skip },
                    { $limit: parseInt(limit.toString()) },
                    {
                        $lookup:
                        {
                            from : "wheelgames",
                            foreignField : "_id",
                            localField : "gameId",
                            as : "game_details"
                        }
                    },
                    {
                        $unwind : { path : '$game_details' , preserveNullAndEmptyArrays : true }
                    }
                ]),
                await Transaction.countDocuments(filteredQuery)
            ]);

            return res.status(200).json(
                {
                    success:true, 
                    data : [],
                    message:"list fetched.",
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