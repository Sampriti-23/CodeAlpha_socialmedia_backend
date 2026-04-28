const User =require("../models/User")

//create user
exports.createuser= async(req,res)=>{
    try{
        const user = await User.create(req.body)
       await user.save()
       res.status(200).json(user)
    }catch(err){
        res.status(400).json({error: err.message})
    }           
};

//get all users
exports.getallusers = async(req,res)=>{
    try{
        const users = await User.find()
        res.json(users)
    }catch(err){
        res.status(500).json({error: err.message})
    }
};

//get all user by id
exports.getalluserbyid = async(req,res)=>{
    try{
        const user = await User.findById(req.params.id)
        if(!user){
            return res.status(422).json({error: "user not found!",statusCode: 422})
        }
        res.status(200).json(user)
    }catch(err){
        res.status(400).json({error: err.message})
    }
};

//update user
exports.updateuser = async(req,res)=>{
    try{
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true})
        if(!user){
            return res.status(422).json({error: "user not found!",statusCode: 422})
        }   
        res.status(200).json(user)
    }catch(err){
        res.status(400).json({error: err.message})
    }
};

//delete user
exports.deleteuser = async(req,res)=>{
    try{   
        const user = await User.findByIdAndDelete(req.params.id)
        if(!user){
            return res.status(422).json({error: "user not found!",statusCode: 422})
        }
        res.status(200).json({message: "user deleted successfully!"})
    }catch(err){   
        res.status(400).json({error: err.message})
    }
};