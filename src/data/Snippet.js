/**
 * Text Snippet
 */
class Snippet {

  static FOR_COMMENT = 'for_comment';
  static FOR_SUMMARY = 'for_summary';

  static newKey() {
    return 'SNIP_' + Math.random().toString();
  }

  static compare(snippet1, snippet2) {
    if (snippet1.text < snippet2.text) {
      return -1;
    } else if (snippet1.text > snippet2.text) {
      return 1;
    } else {
      return 0;
    }
  }

  /**
   * Unique identifier of the snippet
   * Will be auto-generated for a new snippet
   * @type {string}
   */
  key = '';

  /**
   * Purpose if the snippen (FOR_COMMENT|FOR_SUMMARY)
   * @type {string}
   */
  purpose = '';

  /**
   * Snippet text
   * @type {string}
   */
  text = '';

  /**
   * Snippet is deleted
   * @type {string}
   */
  deleted = false;


  /**
   * Constructor - gets properties from a data object
   * @param {object} data
   */
  constructor(data = {}) {

    if (data.key !== undefined && data.key !== null) {
      this.key = data.key.toString()
    } else {
      // get a temporary random key
      this.key = Snippet.newKey()
    }
    if (data.purpose !== undefined && data.purpose !== null) {
      this.purpose = data.purpose.toString()
    }
    if (data.text !== undefined && data.text !== null) {
      this.text = data.text.toString()
    }
  }

  /**
   * Get a plain data object from the public properties
   */
  getData() {

    return {
      key: this.key,
      purpose: this.purpose,
      text: this.text,
    }
  }
}

export default Snippet;
