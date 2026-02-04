import { Request, Response } from "express";
import {User} from "../../../models/user.schema.js";
import {OTP} from "../../../models/otp.schema.js";
import { config } from 'dotenv';
import jsonwebtoken from "jsonwebtoken";
import otpGenerator from 'otp-generator';
import bcrypt from "bcrypt";
config();


export const sendSignUpOtp = async (req : Request ,res : Response) : Promise<any>  => 
{
    try{
        const {email} = req.body;
        const userExist = await User.findOne({email});
        
        if(userExist)
        {
            return res.status(401).json({
                success:false,
                message:"User already Registered"
            });
        }

        let otp = await otpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false
        });
        
        let result = await OTP.findOne({otp});
        while(result)
        {
            otp = await otpGenerator.generate(6,{
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false
            });
            
            result = await OTP.findOne({otp});
        }
        console.log("OTP generated " , otp);

        const otpBody = await OTP.create({email , otp});
        console.log(otpBody , "otp added in DB");

        return res.status(200).json({
            success:true,
            data : otp,
            message:"OTP sent Successfully"
        })

    }
    catch(error)
    {
        return res.status(500).json({ 
            success : true , 
            data : [],
            message : 'Something went wrong !'
        })
    }
}


export const userSignup = async ( req : Request ,res : Response):Promise<any> => 
{
    try
    {
        const { username , password ,otp,role, confirm_password , email , gender , phone_number } = req.body;
        if(password !== confirm_password)
            {
                return res.status(400).json({
                    success:false,
                    data : [],
                    message:"Password and Confirm password values does not match . Please try again !"
                })
            }
        const userExist = await User.findOne({email : new RegExp(`^${email}$`, 'i')});
        if(userExist)
        {
            return res.status(400).json({ 
                success : false , 
                data : [],
                message : 'Email is already registered !'
            })
        }

        // const recentOTP = await  OTP.find({email}).sort({createAt:-1}).limit(1);

        // if(recentOTP.length == 0)
        //     {
        //         return res.status(400).json({
        //             success:false,
        //             message:"OTP not found"
        //         })
        //     }else if(otp != recentOTP[0]?.otp)
        //     {
        //         return res.status(400).json({
        //              success:false,
        //              message:"Invalid OTP",
        //         });
        //     }
        
        const hashPassword = await bcrypt.hash(password , 10);
        
        
        const userDetails = await User.create({ 
            username ,
            password : hashPassword,
            profile_pic : { Location : `https://api.dicebear.com/5.x/initials/svg?seed=${username}`,},
            gender ,
            email ,
            phone_number ,
            is_email_verified : true ,
            is_active : true ,
            role : role 
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
        return res.status(500).json({ 
            success : false , 
            data : [],
            message : 'Something went wrong !'
        })
    }
    
}


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

            if(user.role != "User")
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
