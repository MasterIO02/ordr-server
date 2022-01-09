const Render = require("../../models/render")
const Server = require("../../models/server")

// Gets renderer and its rendering in progress informations from a rendererId
module.exports = async progression => {
    let renderer, renderingRender
    try {
        renderer = await Server.findOne({
            id: progression.id
        })
        renderingRender = await Render.findOne({
            _id: renderer.rendering
        })
    } catch (err) {
        console.log("[renderServer] Something went wrong with getRenderInfo", err)
        return {
            renderer: false
        }
    }

    return {
        renderer,
        renderingRender
    }
}
