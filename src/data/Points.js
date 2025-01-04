/**
 * Partial Points given for croteria or comments
 */
class Points {

  /**
   * Unique identifier of the points
   * Will be auto-generated for new points with random alpanumeric key
   * Will be replaces with a numeric key when the points are stored in the backend
   * @type {string}
   */
  key = '';

  /**
   * Key of the correction item to which the points belong
   * @type {string}
   */
  item_key = '';

  /**
   * Key of the corrector to which the points belong
   * @type {string}
   */
  corrector_key = '';

  /**
   * Key of the corrector comment for which the points are given
   * @type {string}
   */
  comment_key = '';

  /**
   * Key of the criterion for which the points are given
   * @type {string}
   */
  criterion_key = '';

  /**
   * Points given
   * @type {float}
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
    if (data.corrector_key !== undefined && data.corrector_key !== null) {
      this.corrector_key = data.corrector_key.toString()
    }
    if (data.comment_key !== undefined && data.comment_key !== null) {
      this.comment_key = data.comment_key.toString()
    }
    if (data.criterion_key !== undefined && data.criterion_key !== null) {
      this.criterion_key = data.criterion_key.toString()
    }
    if (data.points !== undefined && data.points !== null) {
      this.points = parseFloat(data.points);
    }
  }

  /**
   * Set the points value
   * @param value
   */
  setPoints(value) {
    this.points = parseFloat(value);
  }

  /**
   * Get a plain data object from the public properties
   */
  getData() {
    return {
      key: this.key,
      item_key: this.item_key,
      corrector_key: this.corrector_key,
      comment_key: this.comment_key,
      criterion_key: this.criterion_key,
      points: this.points
    }
  }
}

export default Points;
