import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const authenticate = async (req,res,next) => {
    try{
        let token = req.headers.authorization;
        if(token && token.startsWith("Bearer ")){
            token = token.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if(!user){
                return res.status(401).json({message: "User not found"});
            }        
            req.user = user;
            next();
        }
        if(!token){
            return res.status(401).json({message: "Authorization token missing"});
        }
    }
    catch(error){
        return res.status(401).json({message: "Invalid token",
            error: error.message
        })
    }
}