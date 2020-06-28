require('dotenv').config();
// var encrypt = require('mongoose-encryption')
// const md5 = require('md5');
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
const express = require('express');
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express()
const mongoose = require("mongoose");
const findOrCreate = require('mongoose-findorcreate');

// passport 
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;

app.set('view engine','ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret:"Well deep inside there is a storm comming.",
    resave:false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-koustav:bond@007@secret.vwgah.mongodb.net/userDB",{useNewUrlParser:true,useUnifiedTopology: true })
                .then(()=> console.log("Connected to the mongodb"))
                .catch(err => console.log("Could not connnect to mongoDB"))
mongoose.set("useCreateIndex",true);
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId:String,
    secret:String
});

// console.log(process.env.SECRET);
// userSchema.plugin(encrypt,{ secret: process.env.SECRET, encryptedFields: ["password"] ,excludeFromEncryption: ['email'] });
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:4000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/', function (req, res) {
    res.render('home');
  });
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
app.get('/login',(req,res) =>{
     res.render('login');
});
app.get('/register',(req,res) =>{
    res.render('register');
});
app.get('/secrets',(req,res) =>{
    User.find({"secret":{$ne:null}},(err,foundUsers) =>{
        if(err){
            console.log(err);
        }else{
            res.render("secrets",{usersWithSecrets: foundUsers});
        }
    });
});
app.get('/submit',(req,res) =>{
    if(req.isAuthenticated()){
        res.render('submit');
    }else{
        res.redirect("/login");
    }
});
app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
})

app.post("/register",(req,res) =>{
    User.register({username:req.body.username}, req.body.password , function(err,user){
       if(err){
           console.log(err);
           res.redirect("/register");
       } else{
           passport.authenticate("local")(req,res,function(){
               res.redirect("/secrets");
           })
       }
    })
})
app.post("/login",(req,res) =>{
    const user = new User({
        username : req.body.username,
        password : req.body.password
    });
    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    })

});

app.post("/submit",(req,res) =>{
    const submittedSecret = req.body.secret;
    console.log(req.user.id);
    User.findById(req.user.id , function(err,foundUser){
        if(err){
            console.log(err);
    }
    else{
        if(foundUser){
            foundUser.secret = submittedSecret;
            foundUser.save(function(){
                res.redirect("/secrets");
            });
        }
    }
    })
});

const port = process.env.PORT || 4000;
app.listen(port , () =>{
    console.log(`server running at ${port}`);
})