const User = require('../models/User'); // Use the User model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => { 
   try {   
     console.log(req.body);   
     const { username, email, password } = req.body;    
     if (!username || !email || !password) {     
       return res.status(400).json({        
        message: "All fields required",     
       });   
       }   
        const existingUser = await User.findOne({ email });   
         if (existingUser) {      
          return res.status(400).json({        
            message: "User already exists",    
            });  
            }   
             const hashedPassword = await bcrypt.hash(password, 10);   
              const user = new User({    
                  username,    
                    email,     
                     password: hashedPassword,    
                }); 
               await user.save();   
                res.status(201).json({      
                  success: true,     
                   user,    
                  }); 
                 } catch (error) {  
                    console.log("REGISTER ERROR => ", error);  
                      res.status(500).json({ 
                             message: error.message,   
                             }); 
                             }};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: "Login successful", token, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
