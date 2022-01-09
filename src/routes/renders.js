const express = require("express")
const router = express.Router()
const rendersController = require("../controllers/renders")
const multer = require("multer")

// Middlewares
const downloadReplay = require("../middlewares/downloadReplay")
const initialReplayParsing = require("../middlewares/initialReplayParsing")
const rejectRenders = require("../middlewares/rejectRenders")
const onReplaySent = require("../../extensions/onReplaySent")

router.post(
    "",
    downloadReplay.generateRandomString,
    // saveFile for whole file in the form data
    (req, res, next) => {
        downloadReplay.saveFile(req, res, err => {
            if (err instanceof multer.MulterError) {
                return res.status(500).json({
                    message: "An error occured while trying to download your replay. Maybe the field isn't the right name?"
                })
            } else if (err) {
                console.log("Unknown error:", err)
                return res.status(500).json({
                    message: "An unknown error occured while trying to download your replay."
                })
            }
            next()
        })
    },

    // saveExternalReplay for replayUrl
    downloadReplay.saveExternalReplay,
    downloadReplay.uploadFileToServer,
    rejectRenders,
    initialReplayParsing,
    onReplaySent,
    rendersController.createRender
)

router.get("", rendersController.getRenders)

module.exports = router
