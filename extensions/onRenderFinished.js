/*
 * This extension is called when a render is completely finished (marked as 'Done.'), the server doesn't have anything more to do with it.
 * The renderer is already set to 'Idle' state.
 */

module.exports = async (render, renderer) => {
    // render and renderer are mongoose documents, that you can modify and save easily by directly changing the object data and calling .save() on it.
}
