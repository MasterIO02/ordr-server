const Render = require("../models/render")

let renderId

exports.getLastRenderId = () => renderId

exports.addRenderId = () => renderId++

exports.setRenderId = async () => {
    const lastRender = await Render.findOne({}).sort({
        _id: -1
    })
    !lastRender ? (renderId = 0) : (renderId = lastRender.renderID)
    console.log("[BOOT] Latest renderId set")
}
