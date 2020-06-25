require('dotenv').config();
var express = require('express')
const bodyParser = require("body-parser");
var encrypt = require('mongoose-encryption')
const ejs = require("ejs");
var app = express()
const mongoose = require("mongoose");

app.set('view engine','ejs');
app.use(express.static("public"));


app.use(bodyParser.urlencoded({
    extended:true
}));

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology: true })
                .then(()=> console.log("Connected to the mongodb"))
                .catch(err => console.log("Could not connnect to mongoDB"))
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
console.log(process.env.SECRET);
userSchema.plugin(encrypt,{ secret: process.env.SECRET, encryptedFields: ["password"] ,excludeFromEncryption: ['email'] });

const User = new mongoose.model("User",userSchema);

app.get('/', function (req, res) {
  res.render('home');
});
app.get('/login',(req,res) =>{
     res.render('login');
});
app.get('/register',(req,res) =>{
    res.render('register');
});
app.get('/secrets',(req,res) =>{
    res.render('secrets');
});
app.get('/submit',(req,res) =>{
    res.render('submit');
});

app.post("/register",(req,res) =>{
    const newUser = new User({
        email:req.body.username,
        password:req.body.password
    });
    newUser.save(function(err){
        if(err){
            console.log(err);
        }
        else{
            res.render("secrets");
        }
    })
})
app.post("/login",(req,res) =>{
    const  username = req.body.username;
    const  password = req.body.password;
    User.findOne({email:username}, (err,foundUser) =>{
        if(err){
            res.status(400).send("Could not found the user");
        }
        else{
            if(foundUser){
                if(foundUser.password === password){
                    res.render("secrets");
                }
            }
        }
    });
});



const port = process.env.PORT || 4000;
app.listen(port , () =>{
    console.log(`server running at ${port}`);
})