
/**
 * Notion of a change that has not yet been sent to the backend
 */
class UnsentChange {

  /**
   * Key of the data that is not yet sent
   * @type {string}
   */
  key = '';
  
  /**
   * Key of the correction item to which the unsent change belongs
   * @type {string}
   */
  item_key = '';
  
  /**
   * Timestamp of the last change
   * @type {number}
   */
  last_change = 0;

  /**
   * Payload for sending the change to the backend
   * null means that the record with the key should be deleted
   * 
   * @type {object|null}
   */
  payload = null;

  /**
   * Constructor - gets properties from a data object
   * @param {object} data
   */
  constructor(data = {}) {
    this.setData(data);
  }

  /**
   * Set the data from a plain object
   * @param {object} data
   */
  setData(data) {
    if (data.key !== undefined && data.key !== null) {
      this.key = data.key.toString()
    }
    if (data.item_key !== undefined && data.item_key !== null) {
      this.item_key = data.item_key.toString()
    }
    if (data.last_change !== undefined && data.last_change !== null) {
      this.last_change = parseInt(data.last_change);
    }
  }

  
  /**
   * Get a plain data object from the public properties
   * @returns {object}
   */
  getData() {
    return {
      key: this.key,
      item_key: this.item_key,
      text: this.text,
      last_change: this.last_change,
      payload: this.payload
    }
  }
  
}

export default UnsentChange;
