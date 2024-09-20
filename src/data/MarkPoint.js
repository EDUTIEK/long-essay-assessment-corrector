/**
 * Correction Mark Point
 */
class MarkPoint {

  /**
   * X position of the point
   * @type {integer}
   */
  x = 0;

  /**
   * Y position of the point
   * @type {integer}
   */
  y = 0;

  /**
   * Constructor - gets properties from a data object
   * @param {object} data
   */
  constructor(data = {}) {

    if (data.x !== undefined && data.x !== null) {
      this.x = parseInt(data.x);
    }
    if (data.y !== undefined && data.y !== null) {
      this.y = parseInt(data.y);
    }
  }

  /**
   * Get a plain data object from the public properties
   */
  getData() {
    return {
      x: this.x,
      y: this.y,
    }
  }
}

export default MarkPoint;
