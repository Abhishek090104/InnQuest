const mongoose = require("mongoose");
const initData = require('./data.js');
const Listing = require('../models/listing.js');

const MONGO_URL = "mongodb://127.0.0.1:27017/InnQuest";

async function main() {
    await mongoose.connect(MONGO_URL);
}

main()
    .then(() => {
        console.log("Connected to DB");
    })
    .catch(err => {
        console.log(err);
    });


    const initDB = async () => {
        await Listing.deleteMany({});
        initData.data=initData.data.map((obj) => ({...obj, owner:"6727616840908fed203677ef"}));
        await Listing.insertMany(initData.data);
        console.log("data was initialized");
    };

initDB();
