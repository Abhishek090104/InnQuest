require('dotenv').config();


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require('./models/listing.js'); 
const path = require("path");
const methodOverride = require("method-override");
//const MONGO_URL = "mongodb://127.0.0.1:27017/InnQuest";
const dbURL = process.env.ATLASDB_URL;
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const ExpressError = require("./utils/ExpressError.js");
const flash = require("connect-flash");
const listings = require("./routes/listing.js");
const reviews = require("./routes/reviews.js");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const user = require("./models/users.js");

const userRouter = require("./routes/user.js");
async function main() {
    await mongoose.connect(dbURL);
}

main()
    .then(() => {
        console.log("Connected to DB");
    })
    .catch(err => {
        console.log(err);
    });

app.get("/testListing", async (req, res) => {
    let sampleListing = new Listing({
        title: "My New Villa",
        description: "By the beach",
        price: 1200,
        location: "Hyderabad, Telangana",
        country: "India",
    });

    await sampleListing.save();
    console.log("Sample was saved");
    res.send("Successful testing");
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"public")));

const store = MongoStore.create({
    mongoUrl: dbURL,
    crypto: {
        secret: process.env.SECRET
    },
    touchAfter : 24 * 3600,
});

store.on("error", ()=>{
    console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 *60 * 1000,
        maxAge : 7 * 24 * 60 *60 * 1000,
        httpOnly : true
    },
};




app.get("/", (req, res) => {
    res.send("Hi, I am root");
});


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());





app.get("/demouser",async(req,res)=>{
    let fakeuser = new user({
        email:"student@gmail.com",
        username:"delta-student"
    });
  let newreguser = await user.register(fakeuser,"helloworld");
  res.send(newreguser);
});




app.use((req,res,next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error") ;
    res.locals.currUser = req.user;
    next();
});


app.use("/listings",listings);
app.use("/listings/:id/reviews",reviews);
app.use("/", userRouter);


app.get("/search", async (req, res, next) => {
    try {
      const country = req.query.country ? req.query.country.trim() : ""; 
      if (country === "") {
        
        return res.render("listings/search", { listings: [], country });
      }
      const listings = await Listing.find({ country: { $regex: country, $options: "i" } });
      res.render("listings/search", { listings, country });
    } catch (err) {
      next(err); 
    }
  });
  
  


app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not Found"));
});
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong" } = err; // Default status code and message
    res.status(statusCode).send(message);
});

app.listen(8080, () => {
    console.log("Server is listening on port 8080");
});


