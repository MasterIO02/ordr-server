const express = require("express")
const router = express.Router()
const UploadsController = require("../controllers/uploads")
const saveVideo = require("../middlewares/saveVideo")

router.post("", saveVideo, UploadsController.videoPostProcessing)

module.exports = router
