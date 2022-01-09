const beforeRenderFinished = require("../../extensions/beforeRenderFinished")
const writeRenderStatus = require("../renderServer/modules/writeRenderStatus")

exports.videoPostProcessing = async (req, res, next) => {
    if (!req.file) {
        console.log("[express] POST /upload:sendVideo - No video file")
        return res.send("You are not a valid client.")
    }
    if (!req.body.rendererId) {
        console.log("[express] POST /upload:sendVideo - No rendererId")
        return res.send("You are not a valid client.")
    }
    let rendererId = {
        id: req.body.rendererId
    }
    res.status(201).json({
        message: "Video uploaded."
    })
    await writeRenderStatus("endupload", rendererId)
    await beforeRenderFinished(req.file.size, rendererId.id)
    writeRenderStatus("done", rendererId, req.file.size)
}
