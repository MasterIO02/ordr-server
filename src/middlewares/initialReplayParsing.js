const osuReplayParser = require("osureplayparser")
const config = require("../../config.json")
const fs = require("fs")
const { default: axios } = require("axios")
const ojsama = require("ojsama")
const randomstring = require("randomstring")

const calculateAccuracy = require("./helpers/calculateAccuracy")
const getMods = require("./helpers/getMods")
const replaceInvalidCharacters = require("./helpers/replaceInvalidCharacters")
const convertMSS = require("./helpers/convertMSS")

module.exports = async (req, res, next) => {
    console.log(`[express] POST /renders:initialReplayParsing - Starting replay parsing and checks.`)

    req.internal = {}

    let filename
    if (req.body.replayURL) {
        filename = req.filename
    } else {
        filename = req.file.filename
    }

    let replayPath = process.cwd() + "/src/middlewares/replays/" + filename,
        replay

    function deleteReplay() {
        fs.rmSync(replayPath)
    }

    try {
        replay = await osuReplayParser.parseReplay(replayPath)
    } catch {
        try {
            replay = await osuReplayParser.parseReplay(replayPath)
        } catch {
            console.log(`[initialReplayParsing] Cannot parse replay.`)
            deleteReplay()
            return res.status(500).json({
                message: "Cannot parse replay.",
                errorCode: 5
            })
        }
    }

    // for the onReplaySent extension
    req.replay = replay

    // check if std or not
    if (replay.gameMode !== 0) {
        console.log(`[initialReplayParsing] Not standard gamemode.`)
        deleteReplay()
        return res.status(400).json({
            message: "This replay is not an osu!standard replay, o!rdr does not support mania/ctb/taiko.",
            errorCode: 6
        })
    }

    // check if input data is present
    if (replay.replay_length === 0) {
        console.log(`[initialReplayParsing] No input data in the replay.`)
        deleteReplay()
        return res.status(400).json({
            message: "This replay has no input data. Try re-exporting it from osu!.",
            errorCode: 7
        })
    }

    // 2048 is AutoPlay, if that mod is present we reject it
    if (replay.mods & 2048 && config.general.reject_auto_mod) {
        console.log(`[initialReplayParsing] The replay has auto mod.`)
        deleteReplay()
        return res.status(400).json({
            message: "Why would you want to render that? (AT mod not supported)",
            errorCode: 11
        })
    }

    // incompatible mods rejection
    if (
        replay.mods & 16 & 2 ||
        replay.mods & (64 | 512) & 256 ||
        replay.mods & (32 | 16384) & 1 ||
        replay.mods & 128 & 8192 ||
        replay.mods & (128 | 8192) & (32 | 16384 | 2048 | 1) ||
        replay.mods & 4096 & 8192
    ) {
        console.log(`[initialReplayParsing] The replay has incompatible mods.`)
        deleteReplay()
        return res.status(400).json({
            message: "This replay has incompatible mods.",
            errorCode: 26
        })
    }

    // invalid characters in username rejection
    if (
        replay.playerName.includes("?") ||
        replay.playerName.includes('"') ||
        replay.playerName.includes("*") ||
        replay.playerName.includes("<") ||
        replay.playerName.includes(">") ||
        replay.playerName.includes("\\") ||
        replay.playerName.includes("|") ||
        replay.playerName.includes("/") ||
        replay.playerName.includes(":") ||
        replay.playerName.includes("`")
    ) {
        console.log(`[initialReplayParsing] The player username has invalid characters.`)
        deleteReplay()
        return res.status(400).json({
            message: "This replay has an invalid username.",
            errorCode: 12
        })
    }

    req.internal.accuracy = await calculateAccuracy(replay.number_300s, replay.number_100s, replay.number_50s, replay.misses)
    if (replay.playerName) {
        req.internal.replayUsername = replay.playerName
    } else {
        req.internal.replayUsername = "Guest"
        replay.playerName = "Guest"
    }

    // querying the osu! api for the beatmap of this replay
    let osuApiResponse
    try {
        let { data } = await axios.get(`https://osu.ppy.sh/api/get_beatmaps?k=${config.auth.osu_api_key}&h=${replay.beatmapMD5}`, {
            timeout: 10000
        })
        if (data.length === 0) {
            console.log(`[initialReplayParsing] The beatmap of the replay does not exist on osu! (osuApiResponse empty)`)
            return res.status(400).json({
                message: "This beatmap does not exist on osu!. Custom difficulties or non-submitted maps are not supported.",
                errorCode: 8
            })
        }
        osuApiResponse = data
    } catch {
        deleteReplay()
        console.log(`[initialReplayParsing] Cannot connect to osu! api!`)
        return res.status(500).json({
            message: "Cannot connect to osu! api. Retry later.",
            errorCode: 10
        })
    }

    console.log(
        `[renderServer] beatmapset_id of replay is ${osuApiResponse[0].beatmapset_id}, title is "${osuApiResponse[0].title}" difficulty is "${osuApiResponse[0].version}"`
    )

    // force skip for those beatmapsets
    if (osuApiResponse[0].beatmapset_id === 29157 || osuApiResponse[0].beatmapset_id === 965834) {
        req.internal.skip = true
    } else {
        req.internal.skip = typeof req.body.skip !== "undefined" ? req.body.skip : true
    }

    if (osuApiResponse[0].title === "") {
        deleteReplay()
        console.log(`[initialReplayParsing] The map of the replay has no name.`)
        return res.status(400).json({ message: "This map has no name.", errorCode: 24 })
    }

    if (osuApiResponse[0].audio_unavailable === "1") {
        deleteReplay()
        console.log(`[initialReplayParsing] The audio for the map is unavailable.`)
        return res.status(400).json({
            message: "The audio for this map is unavailable, it maybe has been copyright claimed.",
            errorCode: 9
        })
    }

    req.internal.mapTitle = osuApiResponse[0].title
    req.internal.replayDifficulty = osuApiResponse[0].version
    req.internal.mapID = osuApiResponse[0].beatmapset_id
    req.internal.mapLength = osuApiResponse[0].total_length
    req.internal.mapLink = `${config.general.external_map_download_link}${osuApiResponse[0].beatmapset_id}.osz`

    let title = await replaceInvalidCharacters(osuApiResponse[0].title)
    let difficulty = await replaceInvalidCharacters(osuApiResponse[0].version)
    let artist = await replaceInvalidCharacters(osuApiResponse[0].artist)
    let length = await convertMSS(osuApiResponse[0].total_length)

    try {
        let beatmapParser = new ojsama.parser()
        await axios.get(`https://osu.ppy.sh/osu/${osuApiResponse[0].beatmap_id}`).then(({ data }) => {
            beatmapParser.feed(data)
            let map = beatmapParser.map
            let stars = new ojsama.diff().calc({
                map: map,
                mods: replay.mods
            })
            req.internal.beatmapDifficulty = stars.total
        })
    } catch {
        console.log(`[initialReplayParsing] The beatmap difficulty calculator crashed. Using the difficulty from the osu! API`)
        req.internal.beatmapDifficulty = osuApiResponse[0].difficultyrating
    }

    if (req.internal.beatmapDifficulty < config.other.min_stars_for_motion_blur && req.body.motionBlur960fps === true) {
        console.log("[initialReplayParsing] The beatmap difficulty is less than 5 stars. Disabling motion blur.")
        req.internal.motionBlur960fps = false
    } else {
        req.internal.motionBlur960fps = typeof req.body.motionBlur960fps !== "undefined" ? req.body.motionBlur960fps : false
    }

    let mods = await getMods(replay.mods),
        titleModPrefix = "",
        descriptionModPrefix = ""
    if (mods !== "") {
        titleModPrefix = config.general.title_mod_prefix
        descriptionModPrefix = "+"
    }
    req.internal.replayMods = mods ? mods : "None"

    // available variables for video filename configurable in config.json
    let randomString = randomstring.generate(4)
    let beatmapDifficultyRating = Math.round(Number(req.internal.beatmapDifficulty) * 100) / 100
    let replayUsername = replay.playerName
    let songArtist = artist
    let songTitle = title
    let beatmapDifficultyName = difficulty
    let accuracy = Math.round(Number(req.internal.accuracy) * 100) / 100
    let replayMods = mods

    req.internal.title = eval("`" + config.general.videos_filename_schema + "`")
    req.internal.description = `Player: ${replay.playerName}, Map: ${artist} - ${osuApiResponse[0].title} [${osuApiResponse[0].version}] by ${
        osuApiResponse[0].creator
    }, song length is ${length} (${Math.round(Number(req.internal.beatmapDifficulty) * 100) / 100} ⭐) ${descriptionModPrefix}${mods} | Accuracy: ${
        Math.round(Number(req.internal.accuracy) * 100) / 100
    }%`

    if (osuApiResponse[0].total_length > config.other.max_song_length) {
        deleteReplay()
        console.log(
            `[initialReplayParsing] - Rejecting ${osuApiResponse[0].title} [${osuApiResponse[0].version}] because map length > ${config.other.max_song_length} minutes`
        )
        return res.status(400).json({
            message: `Beatmaps longer than ${config.other.max_song_length} minutes are not allowed.`,
            errorCode: 13
        })
    }

    deleteReplay()
    next()
}
