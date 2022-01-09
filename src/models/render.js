const mongoose = require("mongoose")

const renderSchema = mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    readableDate: {
        type: String,
        required: true
    },
    renderID: {
        type: Number,
        required: true
    },
    username: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 30
    },
    progress: {
        type: String,
        required: true
    },
    errorCode: {
        type: Number,
        required: true
    },
    renderer: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    replayFilePath: {
        type: String,
        required: true
    },
    mapLink: {
        type: String,
        required: true
    },
    mapTitle: {
        type: String,
        required: true
    },
    mapLength: {
        type: Number,
        required: true
    },
    replayDifficulty: {
        type: String,
        required: true
    },
    replayUsername: {
        type: String,
        required: true
    },
    replayMods: {
        type: String,
        required: true
    },
    mapID: {
        type: Number,
        required: true
    },
    needToRedownload: {
        type: Boolean,
        required: true
    },
    emergencyStop: {
        type: Boolean,
        required: true
    },
    resolution: {
        type: String,
        enum: ["640x480", "960x540", "1280x720", "1920x1080", "3840x2160"],
        required: true
    },
    globalVolume: {
        type: Number,
        required: true
    },
    musicVolume: {
        type: Number,
        required: true
    },
    hitsoundVolume: {
        type: Number,
        required: true
    },
    useSkinHitsounds: {
        type: Boolean,
        required: true
    },
    showHitErrorMeter: {
        type: Boolean,
        required: true
    },
    showUnstableRate: {
        type: Boolean,
        required: true
    },
    showScore: {
        type: Boolean,
        required: true
    },
    showHPBar: {
        type: Boolean,
        required: true
    },
    showComboCounter: {
        type: Boolean,
        required: true
    },
    showPPCounter: {
        type: Boolean,
        required: true
    },
    showKeyOverlay: {
        type: Boolean,
        required: true
    },
    showScoreboard: {
        type: Boolean,
        required: true
    },
    showAvatarsOnScoreboard: {
        type: Boolean,
        required: true
    },
    showBorders: {
        type: Boolean,
        required: true
    },
    showMods: {
        type: Boolean,
        required: true
    },
    showResultScreen: {
        type: Boolean,
        required: true
    },
    showHitCounter: {
        type: Boolean,
        required: true
    },
    showAimErrorMeter: {
        type: Boolean,
        required: true
    },
    skin: {
        type: String,
        required: true
    },
    useSkinCursor: {
        type: Boolean,
        required: true
    },
    useSkinColors: {
        type: Boolean,
        required: true
    },
    cursorScaleToCS: {
        type: Boolean,
        required: true
    },
    cursorRainbow: {
        type: Boolean,
        required: true
    },
    cursorTrailGlow: {
        type: Boolean,
        required: true
    },
    cursorSize: {
        type: Number,
        required: true,
        min: 0.5,
        max: 2
    },
    cursorTrail: {
        type: Boolean,
        required: true
    },
    drawFollowPoints: {
        type: Boolean,
        required: true
    },
    drawComboNumbers: {
        type: Boolean,
        required: true
    },
    scaleToTheBeat: {
        type: Boolean,
        required: true
    },
    sliderMerge: {
        type: Boolean,
        required: true
    },
    objectsRainbow: {
        type: Boolean,
        required: true
    },
    objectsFlashToTheBeat: {
        type: Boolean,
        required: true
    },
    useHitCircleColor: {
        type: Boolean,
        required: true
    },
    seizureWarning: {
        type: Boolean,
        required: true
    },
    loadStoryboard: {
        type: Boolean,
        required: true
    },
    loadVideo: {
        type: Boolean,
        required: true
    },
    introBGDim: {
        type: Number,
        required: true
    },
    inGameBGDim: {
        type: Number,
        required: true
    },
    breakBGDim: {
        type: Number,
        required: true
    },
    BGParallax: {
        type: Boolean,
        required: true
    },
    showDanserLogo: {
        type: Boolean,
        required: true
    },
    motionBlur960fps: {
        type: Boolean,
        required: true
    },
    skip: {
        type: Boolean,
        required: true
    },
    cursorRipples: {
        type: Boolean,
        required: true
    },
    useBeatmapColors: {
        type: Boolean,
        required: true
    },
    sliderSnakingIn: {
        type: Boolean,
        required: true
    },
    sliderSnakingOut: {
        type: Boolean,
        required: true
    },
    renderStartTime: {
        type: Number,
        required: true
    },
    renderEndTime: {
        type: Number,
        required: true
    },
    renderTotalTime: {
        type: Number,
        required: true
    },
    uploadEndTime: {
        type: Number,
        required: true
    },
    uploadTotalTime: {
        type: Number,
        required: true
    }
})

renderSchema.methods.toJSON = function () {
    let obj = this.toObject()
    delete obj._id
    delete obj.__v
    delete obj.emergencyStop
    return obj
}

module.exports = mongoose.model("Render", renderSchema)
