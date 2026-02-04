import mongoose from 'mongoose';
import {config} from 'dotenv';
config();


const connect = () => {
    mongoose.connect(process.env.MONGODB_URL || '')
    .then(() => console.log("DB Connected Successfully"))
    .catch( (error) => {
        console.log("DB Connection Failed");
        console.error(error);
        process.exit(1);
    } )
};

export {connect}