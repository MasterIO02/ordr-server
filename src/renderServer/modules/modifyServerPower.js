const Server = require("../../models/server")

module.exports = async (id, powerType, isRendering) => {
    if (id === "all") {
        await Server.updateMany(
            {},
            {
                power: "OFFLINE"
            },
            {
                multi: true
            }
        )
    } else {
        let status = isRendering ? "Working" : "Idle"
        await Server.findOneAndUpdate(
            {
                "id": id
            },
            {
                power: powerType,
                lastSeen: Date(),
                status
            }
        )
    }
}
