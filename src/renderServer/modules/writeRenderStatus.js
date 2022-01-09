const getRenderInfo = require("./getRenderInfo")
const markFailedRender = require("./markFailedRender")
const onRenderFinished = require("../../../extensions/onRenderFinished")
const onRenderStep = require("../../../extensions/onRenderStep")

module.exports = async (type, progression) => {
    const { sendAbortRender } = require("../renderServer")

    // TODO: change name of "progression" to something else, in getRenderInfo.js too
    let { renderingRender, renderer } = await getRenderInfo(progression)

    if (renderingRender.emergencyStop) {
        return
    }

    if (renderingRender._id.toString() !== renderer.rendering) {
        console.log(
            `[renderServer] Something is wrong with ${renderer.name}, maybe it renders multiple videos at the same time? Sending abort and sending back this render in queue.`
        )
        sendAbortRender(renderer.id)
        renderer.status = "Errored! Waiting for a restart."
        renderingRender.progress = "In queue..."
        renderer.save()
        renderingRender.save()
        return
    }

    switch (type) {
        case "progress":
            if (renderingRender.errorCode === 0) {
                let progress = /[0-9]+%/.exec(progression.progress)
                progress = progress[0]
                console.log(`[renderServer] ${renderer.name} is at ${progress} for its rendering of ${renderingRender.mapTitle} [${renderingRender.replayDifficulty}]`)
                if (progress === "100%") {
                    renderingRender.progress = "Uploading..."
                    await renderingRender.save()
                } else {
                    renderingRender.progress = `Rendering... (${progress})`
                    await renderingRender.save()
                }
                onRenderStep(renderingRender, renderer)
            }
            break
        case "uploading":
            if (renderingRender.errorCode === 0) {
                console.log(`[renderServer] ${renderer.name} is uploading ${renderingRender.mapTitle} [${renderingRender.replayDifficulty}].`)
                renderingRender.renderEndTime = Date.now()
                renderingRender.renderTotalTime = Date.now() - renderingRender.renderStartTime
                await renderingRender.save()
                onRenderStep(renderingRender, renderer)
            }
            break
        case "endupload":
            if (renderingRender.errorCode === 0) {
                console.log(`[renderServer] ${renderer.name} has done uploading ${renderingRender.mapTitle} [${renderingRender.replayDifficulty}].`)
                renderingRender.progress = "Finalizing..."
                renderingRender.uploadEndTime = Date.now()
                renderingRender.uploadTotalTime = Date.now() - renderingRender.renderEndTime
                await renderingRender.save()
                onRenderStep(renderingRender, renderer)
            }
            break
        case "done":
            if (/*renderingRender.uploadTotalTime === 0 || */ renderingRender.renderTotalTime === 0) {
                markFailedRender(
                    `Render n°${renderingRender.renderID} has no upload time or render time but the video got uploaded! The renderer has probably got 2 renders at the same time, marking this render as failed.`,
                    "Something went wrong, the generated video is not your replay. Try again to send this replay.",
                    27,
                    renderingRender
                )
                renderer.status = "Errored! Waiting for a restart."
                renderer.save()
                return
            }
            renderer.totalRendered = renderer.totalRendered + 1
            renderingRender.progress = "Done."
            await renderingRender.save()
            renderer.status = "Idle"
            await renderer.save()
            console.log(`[renderServer] Render n°${renderingRender.renderID} ${renderingRender.mapTitle} [${renderingRender.replayDifficulty}] is done.`)
            onRenderFinished(renderingRender, renderer)
            break
        case "beatmap_not_found":
            if (!renderingRender.needToRedownload) {
                console.log(`[renderServer] Got beatmap_not_found from ${renderer.name}, retrying with redownload forced for clients.`)
                renderingRender.progress = "In queue..."
                renderingRender.needToRedownload = true
                renderingRender.save()
                renderer.status = "Idle"
                renderer.save()
            } else {
                markFailedRender(
                    `Got beatmap_not_found from ${renderer.name}, client already downloaded latest map, marking render as failed.`,
                    "The beatmap version on the mirror is not the same as the replay, or something's wrong with the mirror. Don't retry sending it, we already retried for you.",
                    20,
                    renderingRender
                )
                renderer.status = "Idle"
                renderer.save()
            }
            break
        case "download_404":
            markFailedRender(
                `${renderer.name} claiming that the beatmap is not found (404), marking render as failed.`,
                "The renderer cannot download the map. This is maybe a server-side problem.",
                19,
                renderingRender
            )
            renderer.status = "Idle"
            renderer.save()
            break
        case "download_replay_404":
            markFailedRender(
                `${renderer.name} claiming go 404 for downloading the replay, marking render as failed.`,
                "The renderer cannot download the replay. Try again to send it.",
                28,
                renderingRender
            )
            renderer.status = "Idle"
            renderer.save()
            break
        case "panic":
            // there is no panic message with progression, but maybe add panic message with progression in future update to detect this kind of problem.
            /*if (progression.includes("missing input data")) {
                markFailedRender(
                    `Got panic from ${renderer.name}: Replay is missing input data.`,
                    "This replay is missing input data.",
                    25,
                    renderingRender
                )
            } else {*/
            markFailedRender(
                `Got unknown panic from ${renderer.name}, marking its render as failed.`,
                "Unknown error from the renderer. Maybe retry to send this replay?",
                18,
                renderingRender
            )
            //}
            renderer.status = "Idle"
            renderer.save()
            break
        case "failed_upload":
            if (renderingRender.errorCode === 0) {
                console.log(`[renderServer] Got failed upload from ${renderer.name}, restarting the render.`)
                renderingRender.progress = "In queue..."
                renderingRender.save()
                renderer.status = "Idle"
                renderer.save()
            }
            break
        case "invalid_data":
            markFailedRender(
                `Got failed render from ${renderer.name} because of invalid data from danser.`,
                "This replay is corrupted. Try re-exporting it.",
                21,
                renderingRender
            )
            renderer.status = "Idle"
            renderer.save()
            break
    }
}
