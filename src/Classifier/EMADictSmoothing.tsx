/**
 * @class EMADictSmoothing
 * @brief Smoothes pose classification.
 * Smoothing is done by computing Exponential Moving Average for every pose
 *  class observed in the given time window. Missed pose classes arre replaced
 *   with 0.
 *
 *   Args:
 *     data: Dictionary with pose classification. Sample:
 *         {
 *           'pushups_down': 8,
 *           'pushups_up': 2,
 *         }
 *
 *  Result:
 *    Dictionary in the same format but with smoothed and float instead of
 *     integer values. Sample:
 *       {
 *         'pushups_down': 8.3,
 *         'pushups_up': 1.7,
 *      }
 */
export class EMADictSmoothing {
  private _windowSize: number;
  private _alpha: number;
  private _dataInWindow: { [key: string]: number }[];

  /**
   * @brief Constructor for the class
   * @param windowSize The time window for the given elements
   * @param alpha The alpha factor
   */
  constructor(windowSize: number = 10, alpha: number = 0.2) {
    this._windowSize = windowSize;
    this._alpha = alpha;
    this._dataInWindow = [];
  }

  /**
   * @brief Calls the EMADictSmoothing funcionalite
   * @param data One dictionary for the original classification
   * @return The same dictionary but with the smooth apply to it
   */
  public call(data: { [key: string]: number }) {
    // Add new data to the beginning of the window for simpler code.

    //self._data_in_window.insert(0, data)
    this._dataInWindow.unshift(data);

    //self._data_in_window = self._data_in_window[:self._window_size]
    this._dataInWindow = this._dataInWindow.slice(0, this._windowSize);

    // Get all keys.
    // keys = set([key for data in self._data_in_window for key, _ in data.items()])
    //[key for data in this._dataInWindow for key, _ in data.items()]
    let keysArray: string[] = [];

    this._dataInWindow.forEach((elem) => {
      for (let key in elem) {
        keysArray.push(key);
      }
    });

    let keys: Set<string> = new Set<string>(keysArray);

    // Get smoothed values.
    //smoothed_data = dict()
    let smoothed_data: { [key: string]: number } = {};
    keys.forEach((key) => {
      let factor: number = 1.0;
      let top_sum: number = 0.0;
      let bottom_sum: number = 0.0;

      this._dataInWindow.forEach((auxData) => {
        //value = data[key] if key in data else 0.0
        let value: number = 0.0;

        if (key in auxData) {
          value = auxData[key];
        }

        top_sum += factor * value;
        bottom_sum += factor;

        // Update factor.
        factor *= 1.0 - this._alpha;
      });

      smoothed_data[key] = top_sum / bottom_sum;
    });

    return smoothed_data;
  }
}
