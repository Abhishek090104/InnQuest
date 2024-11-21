const express = require("express");
const route = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");
const Listing = require('../models/listing.js'); 
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const {storage} = require("../cloudConfig.js");

const upload = multer({storage});

route.route("/")
    .get(wrapAsync(listingController.index))
    .post(
        upload.single('listing[image]'), 
        wrapAsync(listingController.postRoute)
    );

route.get("/new",listingController.renderNewForm);

route.get("/:id",listingController.showRoute );




route.get("/:id/edit",listingController.editRoute);

route.put("/:id",  upload.single('listing[image]'), listingController.putRoute);

route.delete("/:id",listingController.deleteRoute);

module.exports = route;
