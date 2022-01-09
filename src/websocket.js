const config = require("../config.json")
const ioSocket = require("socket.io")(config.general.websocket_port, {
    cors: {
        origin: "*"
    }
})
const Render = require("./models/render")

exports.socketApi = async change => {
    const modifiedRender = await Render.findOne({
        _id: change.documentKey._id
    })
    try {
        if (change.operationType === "update") {
            if (change.updateDescription.updatedFields.progress === "Done.") {
                ioSocket.sockets.emit("render_done_json", { renderID: modifiedRender.renderID })
            } else if (
                change.updateDescription.updatedFields.progress.includes("Rendering") ||
                change.updateDescription.updatedFields.progress === "Waiting for client..." ||
                change.updateDescription.updatedFields.progress === "Finalizing..." ||
                change.updateDescription.updatedFields.progress === "Uploading..."
            ) {
                ioSocket.sockets.emit("render_progress_json", {
                    renderID: modifiedRender.renderID,
                    username: modifiedRender.username,
                    progress: change.updateDescription.updatedFields.progress,
                    renderer: modifiedRender.renderer,
                    description: modifiedRender.description
                })
            } else if (change.updateDescription.updatedFields.progress.includes("Error")) {
                ioSocket.sockets.emit("render_failed_json", {
                    renderID: modifiedRender.renderID,
                    errorCode: change.updateDescription.updatedFields.errorCode,
                    errorMessage: modifiedRender.progress
                })
            }
        } else if (change.operationType === "insert") {
            ioSocket.sockets.emit("render_added_json", { renderID: change.fullDocument.renderID })
        }
    } catch {
        return
    }
}
