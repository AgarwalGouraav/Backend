import {v2 as cloudinary} from "cloudinary";
import fs from "fs"

import dotenv from "dotenv"
//ok dost


// Ensure env is loaded
dotenv.config()
 cloudinary.config({ 
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
    
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        
        
        console.log("file uploaded on cloudinary")
        fs.unlinkSync(localFilePath) // delete after successful upload too!
        return response
    } catch (error) {
        console.log("Cloudinary error:", error)
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath)
        }
        return null
    }
}

const deleteFromCloudinary = async (imageUrl) => {
    try {

        if (!imageUrl) return

        const publicId = imageUrl
            .split("/")
            .pop()
            .split(".")[0]

        await cloudinary.uploader.destroy(publicId)

    } catch (error) {
        console.log("Error deleting image")
    }
}

    export {
        uploadOnCloudinary,
        deleteFromCloudinary
    }
