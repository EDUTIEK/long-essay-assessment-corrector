/**
 * Corrector Comment
 */
class Comment {

  static RATING_CARDINAL = 'cardinal';
  static RAITNG_FAILURE = 'failure';
  static RAITNG_EXCELLENT = 'excellent';

  /**
   * Unique identifier of the comment
   * Will be auto-generated for a new comment with random alpanumeric key (starting with 'temp')
   * Will be replaced with a numeric key when the comment is stored in the backend
   * @type {string}
   */
  key = '';

  /**
   * Key of the correction item to which the comment belongs
   * @type {string}
   */
  item_key = '';

  /**
   * Key of the corrector to which the comment belongs
   * @type {string}
   */
  corrector_key = '';

  /**
   * Number of the first word from the marked text to which the comment belongs
   * @type {integer}
   */
  start_position = 0;

  /**
   * Number of the last word fom the marked text to which the comment belongs
   * @type {integer}
   */
  end_position = 0;

  /**
   * Number of the parent paragraph of the first marked word
   * @type {integer}
   */
  parent_number = 0;

  /**
   * Textual comment
   * @type {string}
   */
  comment = '';

  /**
   * Rating flag (see static values)
   * @type {string}
   */
  rating = '';

  /**
   * Constructor - gets properties from a data object
   * @param data
   */
  constructor(data) {

    if (data.key !== undefined && data.key !== null) {
      this.key = data.key.toString()
    } else {
      // get a temporary random key
      this.key = 'temp' . Math.random().toString();
    }
    if (data.item_key !== undefined && data.item_key !== null) {
      this.item_key = data.item_key.toString()
    }
    if (data.corrector_key !== undefined && data.corrector_key !== null) {
      this.corrector_key = data.corrector_key.toString()
    }
    if (data.start_position !== undefined && data.start_position !== null) {
      this.start_position = parseInt(data.start_position);
    }
    if (data.parent_number !== undefined && data.parent_number !== null) {
      this.parent_number = parseInt(data.parent_number);
    }
    if (data.end_position !== undefined && data.end_position !== null) {
      this.end_position = parseInt(data.end_position);
    }
    if (data.comment !== undefined && data.comment !== null) {
      this.comment = data.comment.toString()
    }
    if (data.rating !== undefined && data.rating !== null) {
      this.rating = data.rating.toString()
    }
  }

  /**
   * Get a plain data object from the public properties
   */
  getData() {
    return {
      key: this.key,
      item_key: this.item_key,
      start_position: this.start_position,
      end_position: this.end_position,
      parent_number: this.parent_number,
      comment: this.comment,
      rating: this.rating
    }
  }
}

export default Comment;
