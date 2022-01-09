const onRenderError = require("../../../extensions/onRenderError")

module.exports = async (logMessage, errorMessage, errorCode, render, fromDistributor) => {
    const { setDistributing } = require("../renderServer")

    console.log(`[renderServer] ${logMessage}`)
    render.progress = `Error: ${errorMessage}`
    render.errorCode = errorCode
    await render.save()

    if (fromDistributor) setDistributing(false)

    await onRenderError(render)

    return
}
