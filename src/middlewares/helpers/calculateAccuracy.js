module.exports = async (perfect, good, ok, miss) => {
    return (100 * (ok * 50 + good * 100 + perfect * 300)) / (ok * 300 + good * 300 + perfect * 300 + miss * 300)
}
