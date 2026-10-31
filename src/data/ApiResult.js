/**
 * Simple result from an api call
 */
export default class ApiResult {

  ok = false;
  code = null;
  message = null;

  /**
   *
   * @param {bool} ok
   * @param {integer} code
   * @param {string} message
   */
  constructor(ok, code = null, message = null) {
    this.ok = !!ok;
    this.code = code;
    this.message = message;
  }
}