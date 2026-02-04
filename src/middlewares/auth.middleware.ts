import { NextFunction, Request, Response } from "express";

import {User} from "../models/user.schema.js";
import {config} from 'dotenv';
import jsonwebtoken from 'jsonwebtoken';
config();


//auth
export const auth = async (req : Request,res : Response,next:NextFunction):Promise<any> =>
{
    try{
        const token = req.cookies.token || req.header("Authorization")?.replace('Bearer',"") || req.body.token;

        //if no token 
        if(!token){
            return res.status(401).json({
                success:false,
                message:"Token is missing",
            })
        }

        //verify the token
        try{
            let secret = process.env.JWT_SECRET || 'SpinWin123'
            const decodeToken = await jsonwebtoken.verify(token , secret);
            req.headers['x-user'] = JSON.stringify(decodeToken);
            console.log(decodeToken , "Decode Token");
        }
        catch(error){
            return res.status(401).json({
                success:false,
                message:"Invalid Token",
            })
        }
        next();

    }catch(error)
    {
        return res.status(401).json({
            success:false,
            message:"Something went wrong while validate !",
        })
    }
}

// isUser 
export const isUser = async (req : Request,res : Response,next:NextFunction):Promise<any> =>
{
    try{
        if(JSON.parse(req.headers['x-user'] as string).accountType !== 'User')
        {
            return res.status(401).json({
                success:false,
                message:"This is protectect route for User only !"
            })
        }
    }
    catch(error)
    {
        return res.status(500).json({
            success:false,
            message:"Something went wrong!"
        })
    }
    next();
}


// isAdmin
export const isAdmin = async (req : Request,res : Response,next:NextFunction):Promise<any> =>
{
    try{
        
        if(JSON.parse(req.headers['x-user'] as string).accountType !== 'Admin')
        {
            return res.status(401).json({
                success:false,
                message:"This is protectect route for Admin only !"
            })
        }
    }
    catch(error)
    {
        return res.status(500).json({
            success:false,
            message:"Something went wrong!"
        })
    }
    next();
}