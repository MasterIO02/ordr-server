const { default: axios } = require("axios")

module.exports = async beatmapsetId => {
    try {
        let { data: minoApiResponse } = await axios.get(`https://catboy.best/api/s/${beatmapsetId}`, { timeout: 10000 })
        return {
            apiResponse: minoApiResponse,
            downloadUrl: `https://catboy.best/d/${beatmapsetId}`,
            filename: beatmapsetId,
            lastBeatmapUpdate: minoApiResponse.LastUpdate
        }
    } catch (err) {
        console.log("[renderServer] Got some problems with the Mino API: " + err)
        return "connect error"
    }
}
