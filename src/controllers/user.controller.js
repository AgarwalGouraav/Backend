import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId) =>
{
try{
    const user = await User.findById(userId)
    const accessToken = user.generateAccess_Token()
    const refreshToken = user.generateRefresh_Token()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false})

    return {accessToken , refreshToken}

} catch(error) {
    throw new ApiError(500 , "Something went wrong while generating tokens")
}
}

const registerUser = asyncHandler( async (req,res) => {
    // get user details from frontend
    // validation (name correct or not empty)
    // check if user already exists(check emial or username)
    // check for images , check for avator
    // if yes ,upload them to cloudinary ,avator
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {fullname , email , username , password} = req.body
    console.log("email: ", email);
    console.log("req.files:", req.files)   

    // if (fullName === "") {
    //     throw new ApiError (400, "fullnaem is required")
    // }

    if (
        [fullname ,email, username, password].some((field) => field?.trim() ==="")
    ) {
        throw new ApiError(400 , "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path

    console.log("req.files:", req.files)        
    console.log("avatarLocalPath:", avatarLocalPath)

    if (!avatarLocalPath) {
        throw new ApiError(400, "AvatarPath file is required")
    }

    const avatar =  await uploadOnCloudinary(avatarLocalPath)
    const coverImage =  await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
         throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
         throw new ApiError(500 , "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler(async (req,res) => {
    // req body -> data
    // username or email validation
    // find the user
    // password check
    // access and refresh token generate
    // send in cookies form
    // send successfull response

    const {email , username , password} = req.body

    if(!username && !email){
        throw new ApiError(400, " username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, " User doesn't exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

     if (!isPasswordValid) {
        throw new ApiError(401, "Invali user credentials")
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken" , accessToken,options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser , accessToken , refreshToken
            },
            "User logged In Successfully"
        )
    )


})

const logoutUser = asyncHandler(async (req , res) => {
    await User.findByIdAndUpdate(
        req.user._id,
    {
        $set: {
            refreshToken: undefined
        }
    },
{
    new: true
} )

const options = {
        httpOnly: true,
        secure: true
    }

    return res.
    status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler (async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    try{
        const decodedToken = jwt.verify(
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)
    if(!user){
        throw new ApiError(401, "Invalid refresh token")
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401 , "Refresh token is expired or used")
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefreshTokens(user._id)

    return res
    .status(200)
    .cookie("accessToken", accessToken , options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
        new ApiResponse(
            200,
            {accessToken, refreshToken: newRefreshToken}, 
            "Access token refreshed"
        )
    )
} catch (error){
    throw new ApiError(401, error?.message || "Invalid refresh token")
}


})

const changeCurrentPassword = asyncHandler (async(req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    if(!user){
   throw new ApiError(404,"User not found")
}

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))

})

const getCurrentUser = asyncHandler (async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,req.user,"current user fetched successfully"))
})

const updateAccountDetails = asyncHandler (async(req, res) => {
    const {fullname, email} = req.body

    if(!fullname || !email){
        throw new ApiError(400,"All fiels are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email:email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200 , user , "Accounts details updated successfully"))

})

const updateUserAvatar = asyncHandler (async(req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    if(req.user.avatar){
   await deleteFromCloudinary(req.user.avatar)
}

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar || !avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.rul
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avatar updated successfully")
    )


})

const updateUserCoverImage = asyncHandler (async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover image file is missing")
    }

    if(req.user.coverImage){
   await deleteFromCloudinary(req.user.coverImage)
}

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage || !coverImage.url){
        throw new ApiError(400,"Error while uploading on cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.rul
            }
        },
        {new: true}
    ).select("-password") 

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Cover Image updated successfully")
    )

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
 }