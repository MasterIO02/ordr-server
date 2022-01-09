const multer = require("multer")
const config = require("../../config.json")
const getRenderInfo = require("../renderServer/modules/getRenderInfo")

let output = config.general.videos_path

const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, output)
    },
    filename: async (req, file, cb) => {
        await getRenderInfo({
            id: req.body.rendererId
        }).then(async data => {
            if (data && data.renderingRender) {
                const fileName = data.renderingRender.title + ".mp4"
                console.log("[express] POST /upload:saveVideo - Saved video file: " + fileName)
                cb(null, fileName)
            } else {
                return cb("[o!rdr] This is not a valid client.")
            }
        })
    }
})

module.exports = multer({
    storage: localStorage
}).single("videoFile")
