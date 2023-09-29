
/**
 * Corrector Summary
 */
class Summary {

  static INCLUDE_NOT = 0;          // don't conclude to documentation
  static INCLUDE_INFO = 1;         // include to documentation as info
  static INCLUDE_RELEVANT = 2;     // include to documentation as relevant for the result

  static ALLOWED_INCLUSIONS = [Summary.INCLUDE_NOT, Summary.INCLUDE_INFO, Summary.INCLUDE_RELEVANT];

  
  /**
   * Key of the correction item to which the summary belongs
   * @type {string}
   */
  item_key = '';

  /**
   * Key of the corrector to which the summary belongs
   * @type {string}
   */
  corrector_key = '';


  /**
   * Summary text
   * @type {string}
   */
  text = '';

  /**
   * Points directly given to this comment
   * @type {float}
   */
  points = 0;

  /**
   * Key of the reached Grade
   * @type {string}
   */
  grade_key = '';

  /**
   * Timestamp of the last change (server time)
   * @type {integer}
   */
  last_change = null;


  /**
   * Marked text is excellent
   * @type {bool}
   */
  is_authorized = false;

  /**
   * level of including comments to the documentation
   * @type {integer}
   */
  include_comments = 0;


  /**
   * level of including comment ratings to the documentation
   * @type {integer}
   */
  include_comment_ratings = 0;


  /**
   * level of including comment points to the documentation
   * @type {integer}
   */
  include_comment_points = 0;

  /**
   * level of including criteria points to the documentation
   * @type {integer}
   */
  include_criteria_points = 0;

  /**
   * level of including writer notes to the documentation
   * @type {integer}
   */
  include_writer_notes = 0;


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
    if (data.item_key !== undefined && data.item_key !== null) {
      this.item_key = data.item_key.toString()
    }
    if (data.corrector_key !== undefined && data.corrector_key !== null) {
      this.corrector_key = data.corrector_key.toString()
    }
    if (data.text !== undefined && data.text !== null) {
      this.text = data.text.toString()
    }
    if (data.points !== undefined && data.points !== null) {
      this.points = parseInt(data.points);
    }
    if (data.grade_key !== undefined && data.grade_key !== null) {
      this.grade_key = data.grade_key.toString()
    }
    if (data.last_change !== undefined && data.last_change !== null) {
      this.last_change = parseInt(data.last_change);
    }
    if (data.is_authorized !== undefined && data.is_authorized !== null) {
      this.is_authorized = !!data.is_authorized;
    }
    if (data.include_comments !== undefined && data.include_comments !== null) {
      this.include_comments = this.transformInclusion(data.include_comments);
    }
    if (data.include_comment_ratings !== undefined && data.include_comment_ratings !== null) {
      this.include_comment_ratings = this.transformInclusion(data.include_comment_ratings);
    }
    if (data.include_comment_points !== undefined && data.include_comment_points !== null) {
      this.include_comment_points = this.transformInclusion(data.include_comment_points);
    }
    if (data.include_criteria_points !== undefined && data.include_criteria_points !== null) {
      this.include_criteria_points = this.transformInclusion(data.include_criteria_points);
    }
    if (data.include_writer_notes !== undefined && data.include_writer_notes !== null) {
      this.include_writer_notes = this.transformInclusion(data.include_writer_notes);
    }
  }
  
  transformInclusion(inclusion) {
    inclusion = parseInt(inclusion);
    if (inclusion <= Summary.INCLUDE_NOT) {
        return Summary.INCLUDE_NOT;
    }
    if (inclusion == Summary.INCLUDE_INFO) {
        return Summary.INCLUDE_INFO;
    }
    if (inclusion >= Summary.INCLUDE_RELEVANT) {
        return Summary.INCLUDE_RELEVANT;
    }
  }

  /**
   * Get a plain data object from the public properties
   * @returns {object}
   */
  getData() {
    return {
      item_key: this.item_key,
      corrector_key: this.corrector_key,
      text: this.text,
      points: this.points,
      grade_key: this.grade_key,
      last_change: this.last_change,
      is_authorized: this.is_authorized,
      include_comments: this.include_comments,
      include_comment_ratings: this.include_comment_ratings,
      include_comment_points: this.include_comment_points,
      include_criteria_points: this.include_criteria_points,
      include_writer_notes: this.include_writer_notes
    }
  }
  
  /**
   * @return {string}
   */
  getKey() {
    return 'ITM-' + this.item_key + '-COR-' + this.corrector_key
  }
  

  /**
   * Get a clone of the object
   * @returns {Summary}
   */
  getClone() {
    return new Summary(this.getData());
  }

  /**
   * Check if this object is equal to another summary
   * @param other
   */
  isEqual(other) {
    for (key in this) {
      if (this[key] !== other[key]) {
        return false;
      }
    }
    return true;
  }
}

export default Summary;
