const { default: axios } = require("axios")

module.exports = async beatmapsetId => {
    try {
        let { data: chimuApiResponse } = await axios.get(`https://api.chimu.moe/v1/set/${beatmapsetId}`, { timeout: 10000 })
        return {
            apiResponse: chimuApiResponse,
            downloadUrl: `https://api.chimu.moe/v1/download/${beatmapsetId}?n=1`,
            filename: beatmapsetId,
            lastBeatmapUpdate: chimuApiResponse.data.LastUpdate
        }
    } catch (err) {
        console.log("[renderServer] Got some problems with the chimu.moe API: " + err)
        return "connect error"
    }
}
