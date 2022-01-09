const getSettings = require("../utils/getSettings")

module.exports = async (req, res, next) => {
    let settings = await getSettings()

    if (settings.rejectAllRenders) {
        console.log("[express] POST /renders:rejectRenders - rejectAllRenders is enabled.")
        return res.status(503).json({ message: "o!rdr is not ready to take render jobs at the moment. Retry later." })
    } else {
        next()
    }
}
