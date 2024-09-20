/**
 * Criterion related Points
 */
class Points {

  /**
   * Unique identifier of the comment
   * Will be auto-generated for a new comment with random alpanumeric key
   * Will be replaces with a numeric key when the comemnt is stored in the backend
   * @type {string}
   */
  key = '';

  /**
   * Key of the correction item to which this points belong
   * @type {string}
   */
  item_key = '';


  /**
   * Key of the corrector comment to which this points belong
   * @type {string}
   */
  comment_key = '';

  /**
   * Key of the criterion for which this points are given
   * @type {string}
   */
  criterion_key = '';

  /**
   * Points given
   * @type {integer}
   */
  points = 0;

  /**
   * Constructor - gets properties from a data object
   * @param {object }data
   */
  constructor(data = {}) {

    if (data.key !== undefined && data.key !== null) {
      this.key = data.key.toString()
    } else {
      // get a temporary random key
      this.key = 'temp' + Math.random().toString();
    }
    if (data.item_key !== undefined && data.item_key !== null) {
      this.item_key = data.item_key.toString()
    }
    if (data.comment_key !== undefined && data.comment_key !== null) {
      this.comment_key = data.comment_key.toString()
    }
    if (data.criterion_key !== undefined && data.criterion_key !== null) {
      this.criterion_key = data.criterion_key.toString()
    }
    if (data.points !== undefined && data.points !== null) {
      this.points = parseInt(data.points);
    }
  }

  /**
   * Set the points value
   * @param value
   */
  setPoints(value) {
    this.points = parseInt(value);
  }

  /**
   * Get a plain data object from the public properties
   */
  getData() {
    return {
      key: this.key,
      item_key: this.item_key,
      comment_key: this.comment_key,
      criterion_key: this.criterion_key,
      points: this.points
    }
  }
}

export default Points;
