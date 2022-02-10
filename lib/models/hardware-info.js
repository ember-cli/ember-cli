'use strict';

const execa = require('execa');
const fs = require('fs');
const logger = require('heimdalljs-logger')('ember-cli:hardware-info');
const os = require('os');

function isUsingBatteryAcpi() {
  try {
    const { stdout } = execa.sync('acpi', ['--ac-adapter']);
    const lines = stdout.split('\n').filter(Boolean);

    return lines.every((line) => /off-line/.test(line));
  } catch (ex) {
    logger.warn(`Could not get battery status from acpi: ${ex}`);
    logger.warn(ex.stack);

    return null;
  }
}

function isUsingBatteryApm() {
  try {
    const { stdout } = execa.sync('apm', ['-a']);

    return parseInt(stdout, 10) === 0;
  } catch (ex) {
    logger.warn(`Could not get battery status from apm: ${ex}`);
    logger.warn(ex.stack);

    return null;
  }
}

function isUsingBatteryBsd() {
  const apm = isUsingBatteryApm();

  if (apm !== null) {
    return apm;
  }

  return isUsingBatteryUpower();
}

function isUsingBatteryDarwin() {
  try {
    const { stdout } = execa.sync('pmset', ['-g', 'batt']);

    return stdout.indexOf('Battery Power') !== -1;
  } catch (ex) {
    logger.warn(`Could not get battery status from pmset: ${ex}`);
    logger.warn(ex.stack);

    return null;
  }
}

function isUsingBatteryLinux() {
  const sysClassPowerSupply = isUsingBatterySysClassPowerSupply();

  if (sysClassPowerSupply !== null) {
    return sysClassPowerSupply;
  }

  const acpi = isUsingBatteryAcpi();

  if (acpi !== null) {
    return acpi;
  }

  return isUsingBatteryUpower();
}

function isUsingBatterySysClassPowerSupply() {
  try {
    const value = fs.readFileSync('/sys/class/power_supply/AC/online');

    return parseInt(value, 10) === 0;
  } catch (ex) {
    logger.warn(`Could not get battery status from /sys/class/power_supply: ${ex}`);
    logger.warn(ex.stack);

    return null;
  }
}

function isUsingBatteryUpower() {
  try {
    const { stdout } = execa.sync('upower', ['--enumerate']);
    const devices = stdout.split('\n').filter(Boolean);

    return devices.some((device) => {
      const { stdout } = execa.sync('upower', ['--show-info', device]);

      return /\bpower supply:\s+yes\b/.test(stdout) && /\bstate:\s+discharging\b/.test(stdout);
    });
  } catch (ex) {
    logger.warn(`Could not get battery status from upower: ${ex}`);
    logger.warn(ex.stack);

    return null;
  }
}

function isUsingBatteryWindows() {
  try {
    const { stdout } = execa.sync('wmic', [
      '/namespace:',
      '\\\\root\\WMI',
      'path',
      'BatteryStatus',
      'get',
      'PowerOnline',
      '/format:list',
    ]);

    return /\bPowerOnline=FALSE\b/.test(stdout);
  } catch (ex) {
    logger.warn(`Could not get battery status from wmic: ${ex}`);
    logger.warn(ex.stack);

    return null;
  }
}

function memorySwapUsedDarwin() {
  try {
    const { stdout } = execa.sync('sysctl', ['vm.swapusage']);
    const match = /\bused = (\d+\.\d+)M\b/.exec(stdout);

    if (!match) {
      throw new Error('vm.swapusage not in output.');
    }

    // convert from fractional megabytes to bytes
    return parseFloat(match[1]) * 1048576;
  } catch (ex) {
    logger.warn(`Could not get swap status from sysctl: ${ex}`);
    logger.warn(ex.stack);

    return null;
  }
}

function memorySwapUsedBsd() {
  try {
    const { stdout } = execa.sync('pstat', ['-s']);
    const devices = stdout.split('\n').filter(Boolean);
    const header = devices.shift();
    const match = /^Device\s+(\d+)(K?)-blocks\s+Used\b/.exec(header);

    if (!match) {
      throw new Error('Block size not found in output.');
    }

    const blockSize = parseInt(match[1], 10) * (match[2] === 'K' ? 1024 : 1);

    return devices.reduce((total, line) => {
      const match = /^\S+\s+\d+\s+(\d+)/.exec(line);

      if (!match) {
        throw new Error(`Unrecognized line in output: '${line}'`);
      }

      return total + parseInt(match[1], 10) * blockSize;
    }, 0);
  } catch (ex) {
    logger.warn(`Could not get swap status from pstat: ${ex}`);
    logger.warn(ex.stack);

    return null;
  }
}

function memorySwapUsedLinux() {
  try {
    const { stdout } = execa.sync('free', ['-b']);
    const lines = stdout.split('\n').filter(Boolean);
    const header = lines.shift();
    const columns = header.split(/\s+/).filter(Boolean);
    const columnUsed = columns.reduce((columnUsed, column, index) => {
      if (columnUsed !== undefined) {
        return columnUsed;
      }

      if (/used/i.test(column)) {
        // there is no heading on the first column, so indices are off by 1
        return index + 1;
      }
    }, undefined);

    if (columnUsed === undefined) {
      throw new Error('Could not find "used" column.');
    }

    for (const line of lines) {
      const columns = line.split(/\s+/).filter(Boolean);

      if (/swap/i.test(columns[0])) {
        return parseInt(columns[columnUsed], 10);
      }
    }

    throw new Error('Could not find "swap" row.');
  } catch (ex) {
    logger.warn(`Could not get swap status from free: ${ex}`);
    logger.warn(ex.stack);

    return null;
  }
}

function memorySwapUsedWindows() {
  try {
    const { stdout } = execa.sync('wmic', ['PAGEFILE', 'get', 'CurrentUsage', '/format:list']);
    const match = /\bCurrentUsage=(\d+)/.exec(stdout);

    if (!match) {
      throw new Error('Page file usage info not in output.');
    }

    return parseInt(match[1], 10) * 1048576;
  } catch (ex) {
    logger.warn(`Could not get swap status from wmic: ${ex}`);
    logger.warn(ex.stack);

    return null;
  }
}

const hwinfo = {
  /**
   * Indicates whether the host is running on battery power.  This can cause
   * performance degredation.
   *
   * @private
   * @method isUsingBattery
   * @for HardwareInfo
   * @param {String=process.platform} platform The current hardware platform.
   *                                           USED FOR TESTING ONLY.
   * @return {null|Boolean} `true` iff the host is running on battery power or
   *                         `false` if not.  `null` if the battery status
   *                         cannot be determined.
   */
  isUsingBattery(platform = process.platform) {
    switch (platform) {
      case 'darwin':
        return isUsingBatteryDarwin();

      case 'freebsd':
      case 'openbsd':
        return isUsingBatteryBsd();

      case 'linux':
        return isUsingBatteryLinux();

      case 'win32':
        return isUsingBatteryWindows();
    }

    logger.warn(`Battery status is unsupported on the '${platform}' platform.`);

    return null;
  },

  /**
   * Determines the amount of swap/virtual memory currently in use.
   *
   * @private
   * @method memorySwapUsed
   * @param {String=process.platform} platform The current hardware platform.
   *                                           USED FOR TESTING ONLY.
   * @return {null|Number} The amount of used swap space, in bytes.  `null` if
   *                        the used swap space cannot be determined.
   */
  memorySwapUsed(platform = process.platform) {
    switch (platform) {
      case 'darwin':
        return memorySwapUsedDarwin();

      case 'freebsd':
      case 'openbsd':
        return memorySwapUsedBsd();

      case 'linux':
        return memorySwapUsedLinux();

      case 'win32':
        return memorySwapUsedWindows();
    }

    logger.warn(`Swap status is unsupported on the '${platform}' platform.`);

    return null;
  },

  /**
   * Determines the total amount of memory available to the host, as from
   * `os.totalmem`.
   *
   * @private
   * @method memoryTotal
   * @return {Number} The total memory in bytes.
   */
  memoryTotal() {
    return os.totalmem();
  },

  /**
   * Determines the amount of memory currently being used by the current Node
   * process, as from `process.memoryUsage`.
   *
   * @private
   * @method memoryUsed
   * @return {Object} The Resident Set Size, as reported by
   *                  `process.memoryUsage`.
   */
  memoryUsed() {
    return process.memoryUsage().rss;
  },

  /**
   * Determines the number of logical processors available to the host, as from
   * `os.cpus`.
   *
   * @private
   * @method processorCount
   * @return {Number} The number of logical processors.
   */
  processorCount() {
    return os.cpus().length;
  },

  /**
   * Determines the average processor load across the system.  This is
   * expressed as a fractional number between 0 and the number of logical
   * processors.
   *
   * @private
   * @method processorLoad
   * @param {String=process.platform} platform The current hardware platform.
   *                                           USED FOR TESTING ONLY.
   * @return {Array<Number>} The one-, five-, and fifteen-minute processor load
   *                         averages.
   */
  processorLoad(platform = process.platform) {
    // The os.loadavg() call works on win32, but never returns correct
    // data.  Better to intercept and warn that it's unsupported.
    if (platform === 'win32') {
      logger.warn(`Processor load is unsupported on the '${platform}' platform.`);

      return null;
    }

    return os.loadavg();
  },

  /**
   * Gets the speed of the host's processors.
   *
   * If more than one processor is found, the average of their speeds is taken.
   *
   * @private
   * @method processorSpeed
   * @return {Number} The average processor speed in MHz.
   */
  processorSpeed() {
    const cpus = os.cpus();

    return cpus.reduce((sum, cpu) => sum + cpu.speed, 0) / cpus.length;
  },

  /**
   * Determines the time since the host was started, as from `os.uptime`.
   *
   * @private
   * @method uptime
   * @return {Number} The number of seconds since the host was started.
   */
  uptime() {
    return os.uptime();
  },
};

module.exports = hwinfo;
