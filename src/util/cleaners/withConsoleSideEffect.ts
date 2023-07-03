import { Cleaner } from 'cleaners'

type Level = 'info' | 'warn' | 'error'

/**
 * Wraps a cleaner with a side-effect to log the raw input to the console if the
 * cleaner fails. It returns a cleaner with the same signature as the input
 * cleaner.
 *
 * @param asT A cleaner to wrap
 * @param level the log level to use if an error is thrown (default 'info')
 * @returns The cleaner argument wrapped with the logging side-effect.
 */
export const withConsoleSideEffect =
  <T>(asT: Cleaner<T>, level: Level = 'info'): Cleaner<T> =>
  raw => {
    try {
      return asT(raw)
    } catch (error) {
      console[level](`${String(error)}:`, raw)
      throw error
    }
  }
