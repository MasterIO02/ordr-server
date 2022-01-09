const Server = require("../models/server")
const { getFromCache, cache } = require("../utils/cache")

exports.createServer = (req, res, next) => {
    const server = new Server({
        id: req.body.id.id,
        enabled: false,
        lastSeen: Date(),
        rendering: "nothing",
        name: req.body.name,
        avgFPS: req.body.priority,
        power: "OFFLINE",
        status: "Idle",
        totalRendered: 0,
        renderingType: req.body.renderingType,
        cpu: req.body.cpu,
        gpu: req.body.gpu,
        motionBlurCapable: false,
        uhdCapable: false,
        usingOsuApi: false
    })
    server
        .save()
        .then(_ => {
            console.log("[mongoose] Server creation success.")
            res.status(201).json({
                message: "Client application sent successfully!"
            })
        })
        .catch(error => {
            res.status(500).json({
                message: "Failed to send the application."
            })
            console.log("[mongoose] Failed server creation. " + error)
        })
}

exports.getServers = async (req, res, next) => {
    // performance measurement
    const startTime = performance.now()

    let cachedData = await getFromCache("servers")
    if (typeof cachedData !== "undefined") {
        console.log(`[express] GET /servers | ${(performance.now() - startTime).toFixed(2)}ms - CACHED`)
        return res.status(200).json(cachedData)
    }

    const serverQuery = Server.find({
        enabled: true
    }).lean()

    let fetchedServers
    serverQuery
        .then(documents => {
            fetchedServers = documents
            let servers = []
            for (let {
                enabled,
                lastSeen,
                name,
                avgFPS,
                power,
                status,
                totalRendered,
                renderingType,
                cpu,
                gpu,
                motionBlurCapable,
                usingOsuApi,
                uhdCapable
            } of fetchedServers) {
                servers.push({
                    enabled,
                    lastSeen,
                    name,
                    avgFPS,
                    power,
                    status,
                    totalRendered,
                    renderingType,
                    cpu,
                    gpu,
                    motionBlurCapable,
                    usingOsuApi,
                    uhdCapable
                })
            }
            let toSend = { servers }
            res.status(200).json(toSend)
            console.log(`[express] GET /servers | ${(performance.now() - startTime).toFixed(2)}ms`)
            cache(toSend, 5, "servers")
        })
        .catch(error => {
            res.status(500).json({
                message: "Failed to fetch servers list."
            })
            console.log("[mongoose] Failed /servers fetch. " + error)
        })
}
