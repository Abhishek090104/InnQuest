const express = require("express");
const wrapAsync = require("../utils/wrapAsync.js");
const route = express.Router({mergeParams: true});
const Review = require('../models/review.js');
const ExpressError = require("../utils/ExpressError.js");
const Listing = require('../models/listing.js'); 

route.delete("/:id/:reviewId", 
    (async (req, res) => {
        let { id, reviewId } = req.params; 
        console.log(req.params);
        // Check if id and reviewId are being received correctly
        if (!id || !reviewId) {
            throw new Error("ID or review ID is missing");
        }

        await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
       let deletedReview =  await Review.findByIdAndDelete(reviewId);
       console.log(deletedReview);
    

        res.redirect(`/listings/${id}`);
    })
);




route.post("/", async(req,res)=>{
    
  let listing = await Listing.findById(req.params.id);
   let newReview = new Review(req.body.review);


   listing.reviews.push(newReview);

   await newReview.save();
   await listing.save();

   console.log("new review saved successfully");
   res.redirect(`/listings/${listing._id}`);
});

module.exports = route;