/**
 * Essay Page
 */
class Page {

    /**
     * Unique identifier of the page
     * @type {string}
     */
    key = '';

    /**
     * Key of the correction item to which the page belongs
     * @type {string}
     */
    item_key = '';


    /**
     * Number of the page in the sequence
     * @type {integer}
     */
    page_no = 0;

    /**
     * Width of the page image
     * @type {integer}
     */
    width = 0;

    /**
     * Height of the page image
     * @type {integer}
     */
    height = 0;


    /**
     * Width of the page thumbnail
     * @type {integer|null}
     */
    thumb_width = null;

    /**
     * Height of the page thumbnail
     * @type {integer|null}
     */
    thumb_height = null;

    /**
     * Url to fetch the page image
     * @type {string}
     */
    url = null;

    /**
     * Object url to use a fetched page image 
     * Will be set separately and is not provided by getData()
     * Must be revoked if the page is removed
     * @type {string|null}
     */
    objectUrl = null;
    
    
    /**
     * Constructor - gets properties from a data object
     * @param {object} data
     */
    constructor(data = {}) {

        if (data.key !== undefined && data.key !== null) {
            this.key = data.key.toString();
        } 
        if (data.item_key !== undefined && data.item_key !== null) {
            this.item_key = data.item_key.toString();
        }
        if (data.page_no !== undefined && data.page_no !== null) {
            this.page_no = parseInt(data.page_no);
        }
        if (data.width !== undefined && data.width !== null) {
            this.width = parseInt(data.width);
        }
        if (data.height !== undefined && data.height !== null) {
            this.height = parseInt(data.height);
        }
        if (data.thumb_width !== undefined && data.thumb_width !== null) {
            this.thumb_width = parseInt(data.thumb_width);
        }
        if (data.thumb_height !== undefined && data.thumb_height !== null) {
            this.thumb_height = parseInt(data.thumb_height);
        }
        if (data.url !== undefined && data.url !== null) {
            this.url = data.url.toString();
        }
    }

    /**
     * Get a plain data object from the public properties
     */
    getData() {
        return {
            key: this.key,
            item_key: this.item_key,
            page_no: this.page_no,
            width: this.width,
            height: this.height,
            thumb_width: this.thumb_width,
            thumb_height: this.thumb_height,
            url: this.url
        }
    }
}

export default Page;
