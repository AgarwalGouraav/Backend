import dotenv from "dotenv"
dotenv.config()

import express from "express"
import connectDB from "./db/index.js";

const app = express()

connectDB()
.then(() => {
    app.on("error", (error) => {
    console.log("ERRR: ", error);
    throw error
})
    app.listen(process.env.PORT || 8000 , () => {
console.log(`Server is runnig at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!!" , err);
})

/*
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express"
const app = express()

;(async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/$
            {DB_NAME}`)
            app.on("error",(error)=>{
                console.log("ERRR: ",error);
                throw error
            })
            app.listen(process.env.PORT,() => {
                console.log(`App is listening on port $
                    {process.env.PORT}`);
            })
    }catch(error){
        console.error("ERROR:" , error)
        throw err
    }

})()
    */