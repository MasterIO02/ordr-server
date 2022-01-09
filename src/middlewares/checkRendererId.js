const Server = require("../models/server")

module.exports = async (req, res, next) => {
    let server = await Server.findOne({
        id: req.body.rendererId
    })
    if (server === null) {
        res.status(403).json({
            message: "You are not a valid client."
        })
        console.log("[express] POST /upload:checkRendererId - Fake upload?!")
    } else {
        next()
    }
}
