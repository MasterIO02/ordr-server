const config = require("../../config.json")

// Dependencies import
const io = require("socket.io")(config.general.clients_websocket_port)
const fs = require("fs")
const Client = require("ssh2-sftp-client")
let sftp = new Client()
const { default: axios } = require("axios")

// DB Models import
const Render = require("../models/render")
const Server = require("../models/server")
const Beatmap = require("../models/beatmap")
const PanicReport = require("../models/panic_report")

// Misc functions import
const modifyServerPower = require("./modules/modifyServerPower")
const writeRenderStatus = require("./modules/writeRenderStatus")
const { socketApi } = require("../websocket")
const findAndFlagOfflineClient = require("./modules/findAndFlagOfflineClient")
const markFailedRender = require("./modules/markFailedRender")
const getSettings = require("../utils/getSettings")
const getRenderInfo = require("./modules/getRenderInfo")

// Extensions import
const onRenderStart = require("../../extensions/onRenderStart")

// Global variables declaration
let connectedServers = [],
    distributing,
    lastTimeDistributed = 0,
    distributingRetryCount = 0

sftp.connect({
    host: config.auth.ftp_host,
    port: "22",
    username: config.auth.ftp_username,
    password: config.auth.ftp_pass
})

exports.setDistributing = value => {
    if (typeof value === "boolean") distributing = value
}

exports.renderServer = () => {
    Render.watch().on("change", change => {
        if (!distributing /* && change.operationType !== "change"*/) {
            if (lastTimeDistributed + 10000 <= Date.now()) {
                distributeRenders()
                lastTimeDistributed = Date.now()
            }
        }
        socketApi(change)
    })

    /*
     **  SOCKET.IO CONNECT / DISCONNECT / PROGRESSION HANDLER
     */

    io.on("connection", socket => {
        socket.on("id", async clientState => {
            if (
                !clientState.id ||
                !clientState.version ||
                typeof clientState.usingOsuApi === "undefined" ||
                typeof clientState.motionBlurCapable === "undefined" ||
                typeof clientState.uhdCapable === "undefined" ||
                typeof clientState.isRendering === "undefined"
            )
                return

            let { id, version, usingOsuApi, motionBlurCapable, uhdCapable, isRendering } = clientState

            const connectedServer = await Server.findOne({
                id: id
            })
            socket.ordrId = id
            let toPush = {
                ordrId: socket.ordrId,
                socketId: socket.id
            }

            if (connectedServer && connectedServer.enabled && connectedServer.power !== "ONLINE") {
                let serverToRemove = connectedServers.find(e => e.ordrId === socket.ordrId)
                if (serverToRemove) {
                    for (let i = 0; i < connectedServers.length; i++) {
                        if (connectedServers[i].ordrId === serverToRemove.ordrId) {
                            connectedServers.splice(i, 1)
                        }
                    }
                }

                if (version < config.general.minimum_client_version) {
                    console.log(`[renderServer] Client_WS - Client version of ${socket.id} is too old!`)
                    io.to(socket.id).emit("version_too_old")
                    return
                }

                connectedServers.push(toPush)
                connectedServer.usingOsuApi = usingOsuApi
                connectedServer.motionBlurCapable = motionBlurCapable
                connectedServer.uhdCapable = uhdCapable
                connectedServer.save()
                console.info(`[renderServer] Client_WS - Client connected [socket.io id=${socket.id}, o!rdr id=${id}]`)
                setTimeout(() => {
                    modifyServerPower(id, "ONLINE", isRendering)
                    setTimeout(() => {
                        if (!distributing) {
                            distributeRenders()
                        }
                    }, 7000)
                }, config.general.set_online_client_timeout)
            } else {
                console.log(`[renderServer] Client_WS - Client isn't enabled, unknown or is maybe already connected (o!rdr id: ${id}).`)
            }
        })

        socket.on("disconnect", async () => {
            const connectedServer = await Server.findOne({
                id: socket.ordrId
            })
            if (socket && socket.ordrId && connectedServer && connectedServer.enabled) {
                console.log(`[renderServer] Client_WS - Client gone [id=${socket.id}, o!rdr id=${socket.ordrId}]`)
                let serverToRemove = connectedServers.find(e => e.socketId === socket.id)
                if (serverToRemove) {
                    for (let i = 0; i < connectedServers.length; i++) {
                        if (connectedServers[i].socketId === serverToRemove.socketId) {
                            connectedServers.splice(i, 1)
                        }
                    }
                    findAndFlagOfflineClient(socket.ordrId, connectedServers)
                }
            }
        })

        socket.on("progression", progression => {
            if (progression.progress.includes("%")) {
                writeRenderStatus("progress", progression)
            }
            switch (progression.progress) {
                case "beatmap_not_found":
                    writeRenderStatus("beatmap_not_found", progression)
                    break
                case "download_404":
                    writeRenderStatus("download_404", progression)
                    break
                case "download_replay_404":
                    writeRenderStatus("download_replay_404", progression)
                    break
                case "panic":
                    writeRenderStatus("panic", progression)
                    break
                case "failed_upload":
                    writeRenderStatus("failed_upload", progression)
                    break
                case "uploading":
                    writeRenderStatus("uploading", progression)
                    break
                case "invalid_data":
                    writeRenderStatus("invalid_data", progression)
                    break
            }
        })

        socket.on("panic", async ({ id, crash }) => {
            let renderInfo = await getRenderInfo({ id })
            const report = new PanicReport({
                renderer: renderInfo.renderer.name,
                crash
            })
            report.save()
        })
    })

    /*
     **  JOB DISTRIBUTION LOGIC
     */

    async function distributeRenders(skipMotionBlurAndScoreboard) {
        distributing = true
        let renderToFind = { progress: "In queue..." }
        if (skipMotionBlurAndScoreboard) {
            renderToFind = {
                progress: "In queue...",
                motionBlur960fps: false,
                showScoreboard: false
            }
        }
        const renderToSend = await Render.findOne(renderToFind)
        const idleServers = await Server.find({
            status: "Idle",
            enabled: "true",
            power: "ONLINE"
        })

        let settings,
            renderId,
            mapLink,
            apiPointer = 0,
            maxApis,
            mapFilename,
            lastBeatmapUpdate,
            beatmap

        if (idleServers.length <= 0) {
            distributing = false
        } else if (renderToSend === null) {
            if (skipMotionBlurAndScoreboard) console.log("[renderServer] No renders found that does not need motion blur or scoreboard.")
            distributing = false
        } else if (connectedServers.length <= 0) {
            distributing = false
        } else {
            if (renderToSend.emergencyStop) {
                markFailedRender(
                    `Emergency stop triggered, stopping render n°${renderToSend.renderID}`,
                    "Unknown error triggered by an emergency stop.",
                    1,
                    renderToSend,
                    true
                )
                return
            }
            settings = await getSettings()
            maxApis = settings.apisToUse.length
            renderToSend.progress = "Preparing..."
            console.log("[renderServer] Starting preparation of a render.")
            await renderToSend.save()
            writeRender()
        }

        async function callApis(next, callSource) {
            if (next) {
                apiPointer = apiPointer + 1

                // do we have any more beatmap apis left to try?
                if (apiPointer === maxApis - 1) {
                    await markFailedRender(
                        "All APIs are unavailable!",
                        "All beatmap mirrors are unavailable, try again later.",
                        4,
                        renderToSend,
                        true
                    )
                    return "all done"
                }
            } else {
                apiPointer = 0
            }

            let currentApi = require(`./beatmapApis/${settings.apisToUse[apiPointer]}`)
            console.log(`[renderServer] Trying mirror index ${apiPointer}`)
            let currentApiResponse = await currentApi(renderToSend.mapID)

            if (currentApiResponse === "connect error") {
                console.debug("connect error!!!")
                await callApis(true, callSource)
            } else {
                mapLink = currentApiResponse.downloadUrl
                mapFilename = currentApiResponse.filename
                lastBeatmapUpdate = currentApiResponse.lastBeatmapUpdate
            }
        }

        async function writeRender() {
            await callApis(false, "start")

            renderId = renderToSend._id
            if (await sftp.exists(`${config.general.ftp_map_upload_path}${mapFilename}.osz`)) {
                console.log(`[renderServer] Map ${mapFilename} is present.`)
                beatmap = await Beatmap.findOne({
                    id: renderToSend.mapID
                })
                let localBeatmapDate
                if (beatmap && beatmap.lastUpdated) {
                    localBeatmapDate = beatmap.lastUpdated
                } else {
                    localBeatmapDate = 0
                }
                if (localBeatmapDate < lastBeatmapUpdate) {
                    console.log(`[renderServer] Local beatmap of ${renderToSend.mapID} is older than the beatmap on the mirror. Redownloading it.`)
                    renderToSend.needToRedownload = true
                    downloadMap()
                } else {
                    console.log(`[renderServer] Beatmap last update is the same as local beatmap.`)
                    sendRender()
                }
            } else {
                downloadMap()
            }

            async function downloadMap() {
                const beatmapOutput = `${process.cwd()}/src/renderServer/beatmaps/${mapFilename}.osz`

                console.log(`[renderServer] Downloading beatmapset ${renderToSend.mapID} at ${mapLink} for render #${renderToSend.renderID}`)

                let response
                try {
                    response = await axios.get(mapLink, {
                        responseType: "arraybuffer"
                    })
                } catch (e) {
                    onFailedDownload(e)
                    return
                }
                if (!response || !response.data) {
                    onFailedDownload("data for the response is undefined")
                    return
                }
                const fileData = Buffer.from(response.data, "binary")
                fs.writeFileSync(beatmapOutput, fileData)
                let remote = `${config.general.ftp_map_upload_path}${mapFilename}.osz`
                await sftp.put(beatmapOutput, remote)
                // remove the map after having uploaded it via ftp
                fs.rmSync(beatmapOutput)
                console.log(
                    `[renderServer] Finished downloading beatmapset ${renderToSend.mapID} for render #${renderToSend.renderID}, size is ${
                        response.headers["content-length"] ? response.headers["content-length"] + " bytes" : "unknown"
                    }`
                )
                writeBeatmapUpdate()
            }

            async function onFailedDownload(error) {
                console.log(`[renderServer] Error while downloading beatmap ${renderToSend.mapID}`, error)
                let newResponse = await callApis(true)
                if (newResponse !== "all done") {
                    downloadMap()
                } else {
                    markFailedRender(
                        `Beatmap from the mirrors not found for render #${renderToSend.renderID}, skipping render and marking it as failed (${error})`,
                        "Beatmap not found on the mirrors. Retry later.",
                        15,
                        renderToSend,
                        true
                    )
                    return
                }
            }

            async function writeBeatmapUpdate() {
                beatmap = await Beatmap.findOne({
                    id: renderToSend.mapID
                })
                if (lastBeatmapUpdate === "") {
                    lastBeatmapUpdate = "2000-01-01T00:00:00"
                }
                if (beatmap) {
                    beatmap.lastUpdated = lastBeatmapUpdate
                    await beatmap.save()
                    await sendRender()
                } else {
                    const beatmap = new Beatmap({
                        id: renderToSend.mapID,
                        lastUpdated: lastBeatmapUpdate
                    })
                    await beatmap.save()
                    await sendRender()
                }
            }

            async function sendRender() {
                let serversPriority = [],
                    needMotionBlur = false,
                    needScoreboard = false,
                    needUhd = false
                if (renderToSend.motionBlur960fps) {
                    needMotionBlur = true
                }
                if (renderToSend.showScoreboard) {
                    needScoreboard = true
                }
                if (renderToSend.resolution === "3840x2160") {
                    needUhd = true
                }
                for (const idleServer of idleServers) {
                    serversPriority.push({
                        priority: idleServer.avgFPS,
                        id: idleServer.id,
                        motionBlurCapable: idleServer.motionBlurCapable,
                        uhdCapable: idleServer.uhdCapable,
                        usingOsuApi: idleServer.usingOsuApi
                    })
                }
                serversPriority.sort((a, b) => a.priority - b.priority)
                if (needMotionBlur) {
                    let i = serversPriority.length
                    while (i--) {
                        if (serversPriority[i].motionBlurCapable === false) {
                            serversPriority.splice(i, 1)
                        }
                    }
                }

                if (needUhd) {
                    let i = serversPriority.length
                    while (i--) {
                        if (serversPriority[i].uhdCapable === false) {
                            serversPriority.splice(i, 1)
                        }
                    }
                }

                if (needScoreboard) {
                    let i = serversPriority.length
                    while (i--) {
                        if (serversPriority[i].usingOsuApi === false) {
                            serversPriority.splice(i, 1)
                        }
                    }
                }

                let priorityServer
                if (serversPriority[0]) {
                    serversPriority.reverse()
                    priorityServer = serversPriority[0].id
                } else {
                    console.log(
                        `[renderServer] No capable servers were found with needMotionBlur: ${needMotionBlur}, needScoreboard: ${needScoreboard} and needUhd: ${needUhd}`
                    )
                    renderToSend.progress = "In queue..."
                    renderToSend.save()
                    setTimeout(() => {
                        distributing = false
                        distributeRenders(true)
                        console.log("[renderServer] Checking for a render that has no need for motion blur and scoreboard.")
                    }, 20000)
                    setTimeout(() => {
                        if (!distributing) {
                            distributeRenders()
                        }
                    }, 60000)
                    return
                }

                let socketId
                try {
                    socketId = connectedServers.find(e => e.ordrId === priorityServer).socketId
                } catch (err) {
                    if (distributingRetryCount < 1) {
                        console.log("[renderServer] Error on socketId in renderServer. Retrying distributing.")
                        distributingRetryCount++
                        renderToSend.progress = "In queue..."
                        renderToSend.save()
                        distributing = false
                        if (!distributing) {
                            distributeRenders()
                        }
                        return
                    } else {
                        console.log("[renderServer] Too many failures to redistribute. Restarting the server.")
                        renderToSend.progress = "In queue..."
                        setTimeout(async () => {
                            await renderToSend.save().then(() => {
                                process.exit()
                            }, 3000)
                        })
                        return
                    }
                }

                const renderer = await Server.findOne({
                    id: priorityServer
                })
                renderToSend.renderer = renderer.name
                renderToSend.progress = "Waiting for client..."
                renderToSend.renderStartTime = Date.now()
                await renderToSend.save()
                io.to(socketId).emit("data", renderToSend)
                renderer.status = "Working"
                renderer.rendering = renderId
                renderer.save()
                console.log(`[renderServer] Sent render to ${renderer.name}.`)
                onRenderStart(renderToSend, renderer)
                distributing = false
                distributeRenders()
            }
        }
    }
}

exports.sendAbortRender = rendererId => {
    let renderer = connectedServers.find(e => e.ordrId === rendererId)
    io.to(renderer.socketId).emit("abort_render")
}
