const mongoose = require("mongoose");

const hashSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
});

// Creating the Hash model
mongoose.model("HashTable", hashSchema);
