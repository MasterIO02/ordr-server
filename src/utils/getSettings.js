const Settings = require("../models/settings")
const { getFromCache, cache } = require("../utils/cache")

module.exports = async () => {
    let settings = await getFromCache("settings")
    if (typeof settings === "undefined") {
        settings = await Settings.findOne({ version: "latest" })
        cache(settings, 30, "settings")
    }

    return settings
}
