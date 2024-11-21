const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index", { listings: allListings });
};


module.exports.renderNewForm = (req,res)=>{
    if(!req.isAuthenticated()){
       req.flash("error","you have to be logged in to create listing");
       res.redirect("/login");
    }
    else{
    res.render("listings/new");
    }
};

module.exports.showRoute = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
    .populate("reviews")
    .populate("owner");
    res.render("listings/show", { listing });
    
};

module.exports.postRoute = (async(req,res,next) => {
    let url = req.file.path;
    let filename = req.file.filename;
    
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {
        url: url,
        filename: filename
    };
    
     await newListing.save();
     req.flash("success","New Listing Created!");
     res.redirect("/listings");
     
   });


   module.exports.editRoute = async(req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit",{listing});
};


module.exports.putRoute = (async(req,res) => {
    let {id} = req.params;
  let listing =  await Listing.findByIdAndUpdate(id,{...req.body.listing});
  if(typeof req.file!== "undefined"){
  let url = req.file.path;
  let filename = req.file.filename;
  listing.image = {
    url: url,
    filename: filename
};
await listing.save();
}
  req.flash("success","List Updated!");
  res.redirect("/listings");
  
});


module.exports.deleteRoute = (async(req,res)=>{
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log (deletedListing);
    req.flash("success"," Listing deleted!");
    res.redirect("/listings");
    
});