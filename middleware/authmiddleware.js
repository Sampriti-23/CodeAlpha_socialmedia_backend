const jw= require("jsonwebtoken")

exports.protect=(req,res,next)=>{
    const authHeader =req.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer")){
        return res.status(401).json({Message:"Not authorized"})
    }
    try{
        const token = authHeader.split(" ")[1];
        const decoded =jw.verify(token,process.env.JWT_SECRET);
        req.user=decoded;
        next(); 
    } catch(err){
        res.status(401).json({message: "Invalid Token"})
    }
}
    //Admin only

    exports.adminOnly=(req,res,next)=>{
        if(req.user.role != "admin"){
           return res.status(403).json({message: "Admin access only"});
        }
        next();
    };