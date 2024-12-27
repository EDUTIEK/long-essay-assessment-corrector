/**
 * Rating Criterion
 */
class Criterion {

  /**
   * Unique identifier of the criterion
   * @type {string}
   */
  key = '';

  /**
   * Key of the corrector to which this criterion belongs (empty for fixed criteria)
   * @type {string}
   */
  corrector_key = '';

  /**
   * Short title of the criterion which is displayed in one line
   * @type {string}
   */
  title = '';

  /**
   * Long description of ther critierion
   * Can be displayed in a popup
   * @type {string}
   */
  description = '';

  /**
   * Number of points that can be given for this criterion
   * @type {integer}
   */
  points = 0;

  /**
   * Scope of the crierion is general, not the single comment
   * @type {boolean}
   */
  is_general = false;

  /**
   * Constructor - gets properties from a data object
   * @param {object} data
   */
  constructor(data = {}) {
    if (data.key !== undefined && data.key !== null) {
      this.key = data.key.toString()
    }
    if (data.corrector_key !== undefined && data.corrector_key !== null) {
      this.corrector_key = data.corrector_key.toString()
    }
    if (data.title !== undefined && data.title !== null) {
      this.title = data.title.toString()
    }
    if (data.description !== undefined && data.description !== null) {
      this.description = data.description.toString()
    }
    if (data.points !== undefined && data.points !== null) {
      this.points = parseInt(data.points);
    }
    if (data.is_general !== undefined && data.is_general !== null) {
      this.is_general = !!data.is_general;
    }
  }

  /**
   * Get a plain data object from the public properties
   */
  getData() {
    return {
      key: this.key,
      corrector_key: this.corrector_key,
      title: this.title,
      description: this.description,
      points: this.points,
      is_general: this.is_general
    }
  }
}

export default Criterion;
