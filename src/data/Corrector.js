/**
 * Corrector Assignment of a Corrector to a Correction Item
 *
 * This provides basic data for list and comment prefixes
 * If a corrector is assigned to multiple items then this object exists multiple times with different item_keys
 */
class Corrector {


  /**
   * Key of correction item to which the corrector is assigned
   * @type {string}
   */
  item_key = '';

  /**
   * Key of the corrector that is assigned
   * @type {string}
   */
  corrector_key = '';

  /**
   * Title of the corrector (usually derived from the name)
   * @type {string}
   */
  title = '';

  /**
   * Initials of the corrector (usually derived from the name)
   * @type {string}
   */
  initials = '';

  /**
   * Position of the corrector for the item (fist corrector has 0)
   * @type {number}
   */
  position = 0;


  /**
   * Constructor - gets properties from a data object
   * @param {object} data
   */
  constructor(data = {}) {
    if (data.item_key !== undefined && data.item_key !== null) {
      this.item_key = data.item_key.toString();
    }
    if (data.corrector_key !== undefined && data.corrector_key !== null) {
      this.corrector_key = data.corrector_key.toString();
    }
    if (data.title !== undefined && data.title !== null) {
      this.title = data.title.toString();
    }
    if (data.initials !== undefined && data.initials !== null) {
      this.initials = data.initials.toString().toUpperCase();
    }
    if (data.position !== undefined && data.position !== null) {
      this.position = parseInt(data.position);
    }
  }

  /**
   * @return {string}
   */
  getKey() {
    return 'ITM-' + this.item_key + '-COR-' + this.corrector_key
  }

  /**
   * Get a plain data object from the public properties
   */
  getData() {
    return {
      item_key: this.item_key,
      corrector_key: this.corrector_key,
      title: this.title,
      initials: this.initials,
      position: this.position
    }
  }
}

export default Corrector;
