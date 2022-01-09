/*
 * This extension is called when before a render finishes and has a progress of 'Done.'.
 * When runnning this extension, the render state is 'Finalizing'
 */

module.exports = async (videoFileSize, rendererId) => {
    /*
     * Want to get render and renderer informations here?
     * Use this:
     *    const getRenderInfo = require("../src/renderServer/modules/getRenderInfo")
     *    let {renderer, renderingRender: render} = await getRenderInfo({id: rendererId})
     */
}
