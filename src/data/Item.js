/**
 * Correction Item
 *
 * This provides basic data for list of items ti be corrected
 */
class Item {

    /**
     * Key of correction item
     * @type {string}
     */
    key = '';

    /**
     * Title of the item (e.g. the writer's pseudonym)
     * @type {string}
     */
    title = '';

    /**
     * Is a correction allowed for the item
     * @type {boolean}
     */
    correction_allowed = false;

    /**
     * Is an authorization allowed for the item
     * @type {boolean}
     */
    authorization_allowed = false;

    /**
     * Constructor - gets properties from a data object
     * @param {object} data
     */
    constructor(data = {}) {
        if (data.key !== undefined && data.key !== null) {
            this.key = data.key.toString();
        }
        if (data.title !== undefined && data.title !== null) {
            this.title = data.title.toString();
        }
        if (data.correction_allowed !== undefined && data.correction_allowed !== null) {
            this.correction_allowed = !!data.correction_allowed;
        }
        if (data.authorization_allowed !== undefined && data.authorization_allowed !== null) {
            this.authorization_allowed = !!data.authorization_allowed;
        }
    }

    /**
     * @return {string}
     */
    getKey() {
        return this.key
    }

    /**
     * Get a plain data object from the public properties
     */
    getData() {
        return {
            key: this.key,
            title: this.title,
            correction_allowed: this.correction_allowed,
            authorization_allowed: this.authorization_allowed
        }
    }
}

export default Item;
