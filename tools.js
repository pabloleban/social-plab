module.exports = class ImageFieldConnector {
    constructor(inputSelector, imgSelector, context) {
        context.find(inputSelector).on("input", () => {
            imgSelector.attr("src", $(inputSelector).val())
        })
    }
}