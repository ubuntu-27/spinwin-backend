import { model, Schema } from "mongoose";

const userSchema = new Schema({
    username : 
    { 
        type : String ,
        trim : true , 
        required : true 
    },
    profile_pic : 
    {
        type : Object,
    },
    gender : 
    {
        type : String ,
        trim : true 
    },
    password : 
    {
        type : String , 
        required : true 
    },
    email : 
    {
        type : String ,
        trim : true , 
        index : true 
    },
    phone_number : 
    {
        type : String
    },
    role :
    {
        type : String , 
        enum : ['User' , 'Admin'],
        required : true ,
        index : true 
    },
    is_active : 
    {
        type : Boolean,
        default : false 
    },
    is_deleted : 
    {
        type : Boolean , 
        default : false 
    },
    is_email_verified : 
    {
        type : Boolean , 
        default : false 
    },
    crypto_address : 
    {
        type : String , 
        default : null
    }
});

const User =  model('User' , userSchema);

export {User , userSchema };