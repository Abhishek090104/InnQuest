require('dotenv').config();


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require('./models/listing.js'); 
const Booking = require('./models/booking.js');
const path = require("path");
const methodOverride = require("method-override");
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

const { GoogleGenerativeAI } = require("@google/generative-ai");

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



const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  
  

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


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

app.use((req,res,next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error") ;
    res.locals.currUser = req.user;
    next();
});


app.use("/listings",listings);
app.use("/listings/:id/reviews",reviews);
app.use("/", userRouter);





app.get("/listings/:id/booking", async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            req.flash("error", "Listing not found.");
            return res.redirect("/listings");
        }
        res.render("listings/booking", { listing });
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong.");
        return res.redirect("/listings");
    }
});

app.post("/listings/:id/book", async (req, res) => {
    const { startDate, endDate } = req.body;

    try {
        if (!req.user) {
            req.flash("error", "You must be logged in to book a listing.");
            return res.redirect("/login");
        }

        const conflictingBooking = await Booking.findOne({
            listing: req.params.id,
            $or: [
                { startDate: { $lt: new Date(endDate) }, endDate: { $gt: new Date(startDate) } }
            ]
        });

        if (conflictingBooking) {
            req.flash("error", "The selected listing is already booked for this time range.");
            return res.redirect(`/listings/${req.params.id}/booking`);
        }

        const booking = new Booking({
            user: req.user._id, 
            listing: req.params.id,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        });

        await booking.save();
        req.flash("success", "Booking successful!");
        res.redirect(`/listings`);
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong.");
        res.redirect(`/listings/${req.params.id}/booking`);
    }
});

app.post('/get-ai-suggestions', async (req, res) => {
    const userInput = req.body.userInput;
  
    if (!userInput) {
      return res.status(400).send('Input is required.');
    }
  
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      
      const prompt = `
        Based on these preferences: ${userInput}

        Please provide travel destination suggestions in the following format:

        First, ask these essential questions:
        1. What's your ideal temperature range?
        2. What's your budget (luxury, mid-range, or budget)?
        3. What activities interest you most?
        4. When do you plan to travel?

        Then, provide destination suggestions organized as follows:

        WARM/MILD YEAR-ROUND DESTINATIONS:
        [For each destination include:]
        • Name and Location
        • Brief description (2-3 sentences)
        • Best time to visit
        • Must-see attractions
        • Typical weather

        COOL SUMMERS & MILD WINTERS DESTINATIONS:
        [Same format as above]

        FOUR DISTINCT SEASONS DESTINATIONS:
        [Same format as above]

        Format the response with clear spacing between sections and limit to 2-3 top destinations per category.
        Use line breaks and bullet points for clarity.
        Keep descriptions concise but informative.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      // Replace line breaks with HTML breaks for better formatting
      const suggestions = response.text().replace(/\n/g, '<br>');
  
      res.render('listings/aiSuggestions', { suggestions });
    } catch (error) {
      console.error('Error with Gemini API:', error);
      res.status(500).send('Error generating suggestions. Please try again later.');
    }
});
app.get("/", (req, res) => {
    res.send("Hi, I am root");
});







app.get("/demouser",async(req,res)=>{
    let fakeuser = new user({
        email:"student@gmail.com",
        username:"delta-student"
    });
  let newreguser = await user.register(fakeuser,"helloworld");
  res.send(newreguser);
});




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
