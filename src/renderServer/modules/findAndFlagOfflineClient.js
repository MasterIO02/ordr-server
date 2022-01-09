const Server = require("../../models/server")
const Render = require("../../models/render")
const modifyServerPower = require("./modifyServerPower")

module.exports = async (id, connectedServers) => {
    const server = await Server.findOne({
        "id": id
    })
    if (server.status === "Working") {
        const wasRendering = await Render.findOne({
            _id: server.rendering
        })
        setTimeout(() => {
            let serverHasReconnected = connectedServers.some(e => e.ordrId === server.id)
            console.log(`[renderServer] Reconnect status of ${server.name}: ${serverHasReconnected}`)
            if (
                !serverHasReconnected &&
                (wasRendering.progress !== "Done." || wasRendering.progress !== "Finalizing...") &&
                wasRendering.errorCode === 0
            ) {
                if (!wasRendering.emergencyStop) {
                    wasRendering.progress = "In queue..."
                    wasRendering.save()
                    console.log(
                        `[renderServer] The rendering process of ${server.name} (${server.id}) got reset and is now searching for a new renderer.`
                    )
                }
                setTimeout(() => {
                    modifyServerPower(server.id, "OFFLINE")
                }, 1000)
            } else {
                server.status = "Working"
                server.save()
            }
        }, 4000)
    } else {
        setTimeout(() => {
            modifyServerPower(server.id, "OFFLINE")
        }, 1000)
    }
}
