import Mark from '@/data/Mark';

/**
 * Corrector Comment
 */
class Comment {

  static RATING_CARDINAL = 'cardinal';
  static RAITNG_EXCELLENT = 'excellent';

  static ALLOWED_RATING = [Comment.RATING_CARDINAL, Comment.RAITNG_EXCELLENT];

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
   * Text mark: Number of the first word from the marked text to which the comment belongs
   * Image mark: lowest y position of the marks on the page
   * @type {integer}
   */
  start_position = 0;

  /**
   * Text mark: Number of the last word fom the marked text to which the comment belongs
   * Image mark: ignored
   * @type {integer}
   */
  end_position = 0;

  /**
   * Text mark: Number of the parent paragraph of the first marked word
   * Image mark: Number of the page
   * @type {integer}
   */
  parent_number = 0;

  /**
   * Textual comment
   * @type {string}
   */
  comment = '';

  /**
   * Marked text is excellent
   * @type {bool}
   */
  rating_excellent = false;

  /**
   * Marked text has a cardinal failure
   * @type {bool}
   */
  rating_cardinal = false;

  /**
   * label that should be shown for the comment (not stored, dynamically assigned)
   * @type {string}
   */
  label = '';

  /**
   * 'own' for own comment, 'other' for comments of other correctors (not stored, dynamically assigned)
   * @type {string}
   */
  prefix = '';

  /**
   * Image mark: Graphical marks on PDF image assigned to the comment
   * @type {Mark[]}
   */
  marks = [];

  /**
   * Comment is deleted
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
      this.key = 'temp' + Math.random().toString();
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
    if (data.end_position !== undefined && data.end_position !== null) {
      this.end_position = parseInt(data.end_position);
    }
    if (data.parent_number !== undefined && data.parent_number !== null) {
      this.parent_number = parseInt(data.parent_number);
    }
    if (data.comment !== undefined && data.comment !== null) {
      this.comment = data.comment.toString()
    }
    if (data.rating == Comment.RAITNG_EXCELLENT) {
      this.rating_excellent = true;
    } else if (data.rating == Comment.RATING_CARDINAL) {
      this.rating_cardinal = true;
    }
    if (data.marks !== undefined && Array.isArray(data.marks)) {
      for (const mark_data of data.marks) {
        this.addMarkData(mark_data);
      }
    }
  }

  /**
   * Add a new mark by its data
   * @param {object} mark_data
   */
  addMarkData(mark_data) {
    this.marks.push(new Mark(mark_data));
    this.calculateStartPositon();
  }

  /**
   * Set the marks to a new mark
   * @param {object} mark_data
   */
  updateMarkData(mark_data) {
    for (const mark of this.marks) {
      if (mark.key == mark_data.key) {
        mark.setData(mark_data);
      }
    }
    this.calculateStartPositon();
  }

  /**
   * Get the icon of the mark
   * @return string|null
   */
  getMarkIcon() {
    for (const mark of this.marks) {
      return mark.getIcon();
    }
    return null;
  }

  /**
   * Get a mark by its key
   * @param {string }key
   * @return {Mark|null}
   */
  getMarkByKey(key) {
    for (const mark of this.marks) {
      if (mark.key == key) {
        return mark;
      }
    }
    return null;
  }

  /**
   * Get the color for a mark
   * @param {Mark} mark
   */
  getMarkColor(mark) {
    const filled = (mark.shape == Mark.SHAPE_CIRCLE || mark.shape == Mark.SHAPE_POLYGON || mark.shape == Mark.SHAPE_RECTANGLE);

    let color = '';
    if (this.prefix == 'own') {
      if (this.rating_excellent) {
        return filled ? '#E3EFDD80' : '#19e62e';
      } else if (this.rating_cardinal) {
        return filled ? '#FBDED180' : '#bc4710';
      } else {
        return filled ? '#D8E5F480' : '#3365ff';
      }
    } else {
      if (this.rating_excellent) {
        return filled ? '#F7F9F780' : '#19e62e';
      } else if (this.rating_cardinal) {
        return filled ? '#FCF6F480' : '#bc4710';
      } else {
        return filled ? '#F5F7FB80' : '#3365ff';
      }
    }
  }

  /**
   * Get the color for a mark
   * @param {Mark} mark
   */
  getMarkSelectedColor(mark) {
    const filled = (mark.shape == Mark.SHAPE_CIRCLE || mark.shape == Mark.SHAPE_POLYGON || mark.shape == Mark.SHAPE_RECTANGLE);

    if (this.rating_excellent) {
      return filled ? '#BBEBA5A0' : '#19e62e';
    } else if (this.rating_cardinal) {
      return filled ? '#FCB494A0' : '#bc4710';
    } else {
      return filled ? '#94C3FCA0' : '#3365ff';
    }
  }

  /**
   * Calculate the start position as lowest y position of all marks
   */
  calculateStartPositon() {
    let pos = null;
    for (const mark of this.marks) {
      if (pos === null || mark.pos.y > pos) {
        pos = mark.pos.y
      }
    }
    if (pos !== null) {
      this.start_position = pos;
    }
  }

  /**
   * Check if the comment has a mark with a given key
   * @param key
   * @return {boolean}
   */
  hasMarkKey(key) {
    for (const mark of this.marks) {
      if (mark.key == key) {
        return true;
      }
    }
    return false;
  }


  /**
   * Get a plain data object from the public properties
   */
  getData() {
    let marks = [];
    for (const mark of this.marks) {
      marks.push(mark.getData());
    }

    return {
      key: this.key,
      item_key: this.item_key,
      corrector_key: this.corrector_key,
      start_position: this.start_position,
      end_position: this.end_position,
      parent_number: this.parent_number,
      comment: this.comment,
      rating: this.rating_excellent ? Comment.RAITNG_EXCELLENT : (this.rating_cardinal ? Comment.RATING_CARDINAL : ''),
      marks: marks
    }
  }
}

export default Comment;
