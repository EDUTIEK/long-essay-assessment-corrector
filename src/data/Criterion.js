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
   * Constructor - gets properties from a data object
   * @param data
   */
  constructor(data) {
    if (data.key !== undefined && data.key !== null) {
      this.key = data.key.toString()
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
  }

  /**
   * Get a plain data object from the public properties
   */
  getData() {
    return {
      key: this.key,
      title: this.title,
      description: this.description,
      points: this.points
    }
  }
}

export default Criterion;
