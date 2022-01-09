const mongoose = require('mongoose');

const beatmapSchema = mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    lastUpdated: {
        type: String,
        required: true
    },
})


module.exports = mongoose.model('Beatmap', beatmapSchema);