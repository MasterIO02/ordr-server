const mongoose = require("mongoose")

const serverSchema = mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    enabled: {
        type: Boolean,
        required: true
    },
    lastSeen: {
        type: Date,
        required: true
    },
    rendering: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    avgFPS: {
        type: Number,
        required: true
    },
    power: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    totalRendered: {
        type: Number,
        required: true
    },
    renderingType: {
        type: String,
        required: true
    },
    cpu: {
        type: String,
        required: true
    },
    gpu: {
        type: String,
        required: true
    },
    motionBlurCapable: {
        type: Boolean,
        required: true
    },
    uhdCapable: {
        type: Boolean,
        required: true
    },
    usingOsuApi: {
        type: Boolean,
        required: true
    }
})

serverSchema.methods.add = (power, callback) => {
    this.power = power
    return this.save(callback)
}

serverSchema.methods.toJSON = function () {
    let obj = this.toObject()
    delete obj._id
    delete obj.__v
    delete obj.rendering
    delete obj.id
    return obj
}

module.exports = mongoose.model("Server", serverSchema)
