/**
 * Corrector Comment
 */
class Comment {

    static RATING_CARDINAL = 'cardinal';
    static RAITNG_FAILURE = 'failure';
    static RAITNG_EXCELLENT = 'excellent';

    static SHAPE_CIRCLE = 'circle';
    static SHAPE_RECTANGLE = 'rectangle';
    static SHAPE_POLYGON = 'polygon';
    static SHAPE_LINE = 'line';
    static SHAPE_WAVE = 'wave';

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
     * Points directly given to this comment
     * @type {integer}
     */
    points = 0;

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
     * Comment is deleted
     * @type {string}
     */

    deleted = false;


    /**
     * Key of a graphical mark (is kept in database)
     * @type {string}
     */
    mark_key = '';

    /**
     * Shape of a graphical mark (see constant)
     * @type {string}
     */
    mark_shape = '';

    /**
     * Start position of a graphical mark
     * @typedef {{x: number, y: number}} Point
     * @type {Point}
     */
    mark_pos = {x: 0, y: 0};

    /**
     * End position of a graphical mark (line or wave)
     * @typedef {{x: number, y: number}} Point
     * @type {Point}
     */

    mark_end = {x: 0, y: 0};

    /**
     * Width of a graphical mark (rectangle)
     * @type {integer}
     */
    mark_width = 0;

    /**
     * Height of a graphical mark (rectangle)
     * @type {integer}
     */
    mark_height = 0;

    /**
     * Polygon of a graphical mark (polygon)
     * @typedef {{x: number, y: number}} Point
     * @type {Point[]}
     */
    mark_polygon = [];


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
        if (data.points !== undefined && data.points !== null) {
            this.points = parseInt(data.points);
        }
        if (data.rating == Comment.RAITNG_EXCELLENT) {
            this.rating_excellent = true;
        }
        else if (data.rating == Comment.RATING_CARDINAL) {
            this.rating_cardinal = true;
        }
        if (data.mark_key !== undefined && data.mark_key !== null) {
            this.mark_key = data.mark_key;
        }
        if (data.mark_shape !== undefined && data.mark_shape !== null) {
            this.mark_shape = data.mark_shape.toString();
        }
        if (data.mark_pos !== undefined && data.mark_pos !== null) {
            this.mark_pos = { x: parseInt(data.mark_pos.x), y: parseInt(data.mark_pos.y) };
        }
        if (data.mark_end !== undefined && data.mark_end !== null) {
            this.mark_end = { x: parseInt(data.mark_end.x), y: parseInt(data.mark_end.y) };
        }
        if (data.mark_width !== undefined && data.mark_width !== null) {
            this.mark_width = parseInt(data.mark_width);
        }
        if (data.mark_height !== undefined && data.mark_height !== null) {
            this.mark_height = parseInt(data.mark_height);
        }
        if (data.mark_polygon !== undefined && data.mark_polygon !== null) {
            this.mark_polygon = data.mark_polygon;
        }
    }

    /**
     * Get a plain data object from the public properties
     */
    getData() {
        return {
            key: this.key,
            item_key: this.item_key,
            corrector_key: this.corrector_key,
            start_position: this.start_position,
            end_position: this.end_position,
            parent_number: this.parent_number,
            comment: this.comment,
            points: this.points,
            rating: this.rating_excellent ? Comment.RAITNG_EXCELLENT : (this.rating_cardinal ? Comment.RATING_CARDINAL : ''),
            mark_key: this.mark_key,
            mark_shape: this.mark_shape,
            mark_pos: this.mark_pos,
            mark_end: this.mark_end,
            mark_width: this.mark_width,
            mark_height: this.mark_height,
            mark_polygon: this.mark_polygon
        }
    }
}

export default Comment;
