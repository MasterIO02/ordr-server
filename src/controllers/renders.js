const Render = require("../models/render")
const { getFromCache, cache } = require("../utils/cache")
const { getLastRenderId, addRenderId } = require("../utils/lastRenderId")
const { Mutex } = require("async-mutex")
const renderSaveMutex = new Mutex()
const config = require("../../config.json")

exports.createRender = async (req, res, next) => {
    let globalVolume = typeof req.body.globalVolume !== "undefined" ? req.body.globalVolume : 50
    let musicVolume = typeof req.body.musicVolume !== "undefined" ? req.body.musicVolume : 50
    let hitsoundVolume = typeof req.body.hitsoundVolume !== "undefined" ? req.body.hitsoundVolume : 50
    let useSkinHitsounds = typeof req.body.useSkinHitsounds !== "undefined" ? req.body.useSkinHitsounds : true
    let showHitErrorMeter = typeof req.body.showHitErrorMeter !== "undefined" ? req.body.showHitErrorMeter : true
    let showUnstableRate = typeof req.body.showUnstableRate !== "undefined" ? req.body.showUnstableRate : true
    let showScore = typeof req.body.showScore !== "undefined" ? req.body.showScore : true
    let showHPBar = typeof req.body.showHPBar !== "undefined" ? req.body.showHPBar : true
    let showComboCounter = typeof req.body.showComboCounter !== "undefined" ? req.body.showComboCounter : true
    let showPPCounter = typeof req.body.showPPCounter !== "undefined" ? req.body.showPPCounter : true
    let showKeyOverlay = typeof req.body.showKeyOverlay !== "undefined" ? req.body.showKeyOverlay : true
    let showScoreboard = typeof req.body.showScoreboard !== "undefined" ? req.body.showScoreboard : false
    let showAvatarsOnScoreboard = typeof req.body.showAvatarsOnScoreboard !== "undefined" ? req.body.showAvatarsOnScoreboard : false
    let showBorders = typeof req.body.showBorders !== "undefined" ? req.body.showBorders : false
    let showMods = typeof req.body.showMods !== "undefined" ? req.body.showMods : true
    let showResultScreen = typeof req.body.showResultScreen !== "undefined" ? req.body.showResultScreen : true
    let showHitCounter = typeof req.body.showHitCounter !== "undefined" ? req.body.showHitCounter : false
    let showAimErrorMeter = typeof req.body.showAimErrorMeter !== "undefined" ? req.body.showAimErrorMeter : false
    let useSkinCursor = typeof req.body.useSkinCursor !== "undefined" ? req.body.useSkinCursor : true
    let useSkinColors = typeof req.body.useSkinColors !== "undefined" ? req.body.useSkinColors : false
    let useBeatmapColors = typeof req.body.useBeatmapColors !== "undefined" ? req.body.useBeatmapColors : true
    let cursorScaleToCS = typeof req.body.cursorScaleToCS !== "undefined" ? req.body.cursorScaleToCS : false
    let cursorRainbow = typeof req.body.cursorRainbow !== "undefined" ? req.body.cursorRainbow : false
    let cursorTrailGlow = typeof req.body.cursorTrailGlow !== "undefined" ? req.body.cursorTrailGlow : false
    let cursorSize = typeof req.body.cursorSize !== "undefined" ? req.body.cursorSize : 1
    let cursorTrail = typeof req.body.cursorTrail !== "undefined" ? req.body.cursorTrail : true
    let drawFollowPoints = typeof req.body.drawFollowPoints !== "undefined" ? req.body.drawFollowPoints : true
    let drawComboNumbers = typeof req.body.drawComboNumbers !== "undefined" ? req.body.drawComboNumbers : true
    let scaleToTheBeat = typeof req.body.scaleToTheBeat !== "undefined" ? req.body.scaleToTheBeat : false
    let sliderMerge = typeof req.body.sliderMerge !== "undefined" ? req.body.sliderMerge : false
    let objectsRainbow = typeof req.body.objectsRainbow !== "undefined" ? req.body.objectsRainbow : false
    let objectsFlashToTheBeat = typeof req.body.objectsFlashToTheBeat !== "undefined" ? req.body.objectsFlashToTheBeat : false
    let useHitCircleColor = typeof req.body.useHitCircleColor !== "undefined" ? req.body.useHitCircleColor : true
    let seizureWarning = typeof req.body.seizureWarning !== "undefined" ? req.body.seizureWarning : false
    let loadStoryboard = typeof req.body.loadStoryboard !== "undefined" ? req.body.loadStoryboard : true
    let loadVideo = typeof req.body.loadVideo !== "undefined" ? req.body.loadVideo : true
    let introBGDim = typeof req.body.introBGDim !== "undefined" ? req.body.introBGDim : 0
    let inGameBGDim = typeof req.body.inGameBGDim !== "undefined" ? req.body.inGameBGDim : 75
    let breakBGDim = typeof req.body.breakBGDim !== "undefined" ? req.body.breakBGDim : 30
    let BGParallax = typeof req.body.BGParallax !== "undefined" ? req.body.BGParallax : false
    let showDanserLogo = typeof req.body.showDanserLogo !== "undefined" ? req.body.showDanserLogo : true
    let cursorRipples = typeof req.body.cursorRipples !== "undefined" ? req.body.cursorRipples : false
    let sliderSnakingIn = typeof req.body.sliderSnakingIn !== "undefined" ? req.body.sliderSnakingIn : true
    let sliderSnakingOut = typeof req.body.sliderSnakingOut !== "undefined" ? req.body.sliderSnakingOut : false

    let filename
    if (req.file) {
        filename = req.file.filename
    } else if (req.body.replayURL) {
        filename = req.filename
    }
    await saveRender()

    async function saveRender() {
        const render = new Render({
            date: Date.now(),
            readableDate: Date(),
            renderID: getLastRenderId() + 1,
            username: req.body.username,
            progress: "In queue...",
            errorCode: 0,
            renderer: "None",
            description: req.internal.description,
            title: req.internal.title,
            replayFilePath: config.general.external_replay_download_link + filename,
            mapLink: req.internal.mapLink,
            mapTitle: req.internal.mapTitle,
            mapLength: req.internal.mapLength,
            replayDifficulty: req.internal.replayDifficulty,
            replayUsername: req.internal.replayUsername,
            replayMods: req.internal.replayMods,
            mapID: req.internal.mapID,
            needToRedownload: false,
            emergencyStop: false,
            resolution: req.body.resolution,
            globalVolume,
            musicVolume,
            hitsoundVolume,
            useSkinHitsounds,
            showHitErrorMeter,
            showUnstableRate,
            showScore,
            showHPBar,
            showComboCounter,
            showPPCounter,
            showKeyOverlay,
            showScoreboard,
            showAvatarsOnScoreboard,
            showBorders,
            showMods,
            showResultScreen,
            showHitCounter,
            showAimErrorMeter,
            skin: req.body.skin,
            useSkinCursor,
            useSkinColors,
            useBeatmapColors,
            cursorScaleToCS,
            cursorRainbow,
            cursorTrailGlow,
            cursorSize,
            cursorTrail,
            drawFollowPoints,
            drawComboNumbers,
            scaleToTheBeat,
            sliderMerge,
            objectsRainbow,
            objectsFlashToTheBeat,
            useHitCircleColor,
            seizureWarning,
            loadStoryboard,
            loadVideo,
            introBGDim,
            inGameBGDim,
            breakBGDim,
            BGParallax,
            showDanserLogo,
            motionBlur960fps: req.internal.motionBlur960fps,
            skip: req.internal.skip,
            cursorRipples,
            sliderSnakingIn,
            sliderSnakingOut,
            renderStartTime: 0,
            renderEndTime: 0,
            renderTotalTime: 0,
            uploadEndTime: 0,
            uploadTotalTime: 0
        })

        renderSaveMutex.runExclusive(() => {
            render
                .save()
                .then(createdRender => {
                    console.log("[mongoose] Render creation success.")
                    addRenderId()
                    res.status(201).json({
                        message: "Render added successfully",
                        renderID: createdRender.renderID,
                        errorCode: 0
                    })
                    req.body.renderID = createdRender.renderID
                    next()
                })
                .catch(error => {
                    res.status(500).json({
                        message: "Failed to create render. " + error
                    })
                    console.log("[mongoose] Failed render creation. " + error)
                })
        })
    }
}

exports.getRenders = async (req, res, next) => {
    let pageSize, currentPage
    let query = {}
    if (req.query.pageSize !== undefined && req.query.page !== undefined) {
        pageSize = +req.query.pageSize
        currentPage = +req.query.page
    } else {
        pageSize = 50
        currentPage = 1
    }

    if (req.query.ordrUsername !== undefined) {
        query["username"] = { $regex: new RegExp(req.query.ordrUsername.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "ig") }
    }
    if (req.query.replayUsername !== undefined) {
        query["replayUsername"] = { $regex: new RegExp(req.query.replayUsername.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "ig") }
    }
    if (req.query.renderID !== undefined) {
        query["renderID"] = req.query.renderID
    }

    let renderQuery = Render.find(query).sort({ _id: -1 })
    let fetchedRenders
    if (pageSize && currentPage) {
        renderQuery.skip(pageSize * (currentPage - 1)).limit(pageSize)
    }

    // performance measurement
    const startTime = performance.now()

    let uniqueQueryIdentifier = JSON.stringify({
        pageSize,
        currentPage,
        ordrUsername: req.query.ordrUsername,
        replayUsername: req.query.replayUsername,
        renderID: req.query.renderID
    })

    let cachedData = await getFromCache("renders", uniqueQueryIdentifier)
    if (typeof cachedData !== "undefined") {
        console.log(
            `[express] GET /renders pageSize:${req.query.pageSize} page:${req.query.page} | ${(performance.now() - startTime).toFixed(2)}ms - CACHED`
        )
        return res.status(200).json(cachedData)
    }

    renderQuery
        .then(documents => {
            fetchedRenders = documents
            return Render.estimatedDocumentCount(query)
        })
        .then(count => {
            let toSend = {
                renders: fetchedRenders,
                maxRenders: count
            }
            res.status(200).json(toSend)
            console.log(
                `[express] GET /renders pageSize:${req.query.pageSize} page:${req.query.page} | ${(performance.now() - startTime).toFixed(2)}ms`
            )
            cache(toSend, 1, "renders", uniqueQueryIdentifier)
        })
        .catch(error => {
            res.status(500).json({
                message: "Failed to fetch renders list: " + error
            })
            console.log("[mongoose] Failed /renders fetch. " + error)
        })
}
