const mongoose = require("mongoose")

const settingsSchema = mongoose.Schema({
    version: {
        type: String,
        required: true
    },
    apisToUse: {
        type: Array,
        required: true
    },
    rejectAllRenders: {
        type: Boolean,
        require: true
    }
})

module.exports = mongoose.model("settings", settingsSchema)
