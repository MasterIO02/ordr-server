const mongoose = require("mongoose")

const panicReportSchema = mongoose.Schema({
    renderer: {
        type: String,
        required: true
    },
    crash: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model("panic_reports", panicReportSchema)
