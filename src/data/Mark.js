import MarkPoint from '@/data/MarkPoint';

/**
 * Correction Mark
 */
class Mark {

    static SHAPE_CIRCLE = 'circle';
    static SHAPE_RECTANGLE = 'rectangle';
    static SHAPE_POLYGON = 'polygon';
    static SHAPE_LINE = 'line';
    static SHAPE_WAVE = 'wave';

    static ALLOWED_SHAPES = [Mark.SHAPE_CIRCLE, Mark.SHAPE_RECTANGLE, Mark.SHAPE_POLYGON, Mark.SHAPE_LINE, Mark.SHAPE_WAVE];
    
    
    /**
     * Key of a graphical mark (is kept in database)
     * @type {string}
     */
    key = '';

    /**
     * Shape of a graphical mark (see constant)
     * @type {string}
     */
    shape = '';

    /**
     * Start position of a graphical mark
     * @type {MarkPoint}
     */
    pos = new MarkPoint(0, 0);

    /**
     * End position of a graphical mark (line or wave)
     * @type {MarkPoint}
     */
    end = new MarkPoint(0, 0);

    /**
     * Width of a graphical mark (rectangle)
     * @type {integer}
     */
    width = 0;

    /**
     * Height of a graphical mark (rectangle)
     * @type {integer}
     */
    height = 0;

    /**
     * Polygon of a graphical mark (polygon)
     * @type {MarkPoint[]}
     */
    polygon = [];


    /**
     * Symbol to be displayed in a circle
     * @type {string}
     */
    symbol = '';

    /**
     * Constructor - gets properties from a data object
     * @param {object} data
     */
    constructor(data = {}) {

        if (data.key !== undefined && data.key !== null) {
            this.key = data.key;
        }
        if (data.shape !== undefined && Mark.ALLOWED_SHAPES.includes(data.shape)) {
            this.shape = data.shape.toString();
        }
        if (data.pos !== undefined && data.pos !== null) {
            this.pos = new MarkPoint(data.pos);
        }
        if (data.end !== undefined && data.end !== null) {
            this.end = new MarkPoint(data.end);
        }
        if (data.width !== undefined && data.width !== null) {
            this.width = parseInt(data.width);
        }
        if (data.height !== undefined && data.height !== null) {
            this.height = parseInt(data.height);
        }
        if (data.polygon !== undefined && Array.isArray(data.polygon)) {
            for (const point_data of data.polygon) {
                this.polygon.push(new MarkPoint(point_data))
            }
        }
        if (data.symbol !== undefined && data.symbol !== null) {
            this.symbol = data.symbol.toString();
        }
    }
    
    /**
     * Get a plain data object from the public properties
     */
    getData() {
        let polygon = [];
        for (const point of this.polygon) {
            polygon.push(point.getData());
        }
        
        return {
            key: this.key,
            shape: this.shape,
            pos: this.pos.getData(),
            end: this.end.getData(),
            width: this.width,
            height: this.height,
            polygon: polygon,
            symbol: this.symbol,
        }
    }
}

export default Mark;
