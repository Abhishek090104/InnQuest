const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "userSchema", // Reference to the user who made the booking
        required: true
    },
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing", // Reference to the listing being booked
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient search (e.g., for checking conflicts)
bookingSchema.index({ listing: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
