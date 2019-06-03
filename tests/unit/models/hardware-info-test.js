'use strict';

const { expect } = require('../../chai');
const execa = require('execa');
const fs = require('fs');
const os = require('os');
const td = require('testdouble');

const hwinfo = require('../../../lib/models/hardware-info');

const UPOWER_AC_OFF = `  native-path:          /sys/devices/LNXSYSTM:00/device:00/PNP0C0A:00/power_supply/BAT0
  vendor:               NOTEBOOK
  model:                BAT
  serial:               0001
  power supply:         yes
  updated:              Thu Feb  9 18:42:15 2012 (1 seconds ago)
  has history:          yes
  has statistics:       yes
  battery
    present:             yes
    rechargeable:        yes
    state:               discharging
    energy:              22.3998 Wh
    energy-empty:        0 Wh
    energy-full:         52.6473 Wh
    energy-full-design:  62.16 Wh
    energy-rate:         31.6905 W
    voltage:             12.191 V
    time to full:        57.3 minutes
    percentage:          42.5469%
    capacity:            84.6964%
    technology:          lithium-ion
  History (charge):
    1328809335  42.547  charging
    1328809305  42.020  charging
    1328809275  41.472  charging
    1328809245  41.008  charging
  History (rate):
    1328809335  31.691  charging
    1328809305  32.323  charging
    1328809275  33.133  charging
`;

const UPOWER_AC_ON = `  native-path:          /sys/devices/LNXSYSTM:00/device:00/PNP0C0A:00/power_supply/BAT0
  vendor:               NOTEBOOK
  model:                BAT
  serial:               0001
  power supply:         yes
  updated:              Thu Feb  9 18:42:15 2012 (1 seconds ago)
  has history:          yes
  has statistics:       yes
  battery
    present:             yes
    rechargeable:        yes
    state:               charging
    energy:              22.3998 Wh
    energy-empty:        0 Wh
    energy-full:         52.6473 Wh
    energy-full-design:  62.16 Wh
    energy-rate:         31.6905 W
    voltage:             12.191 V
    time to full:        57.3 minutes
    percentage:          42.5469%
    capacity:            84.6964%
    technology:          lithium-ion
  History (charge):
    1328809335  42.547  charging
    1328809305  42.020  charging
    1328809275  41.472  charging
    1328809245  41.008  charging
  History (rate):
    1328809335  31.691  charging
    1328809305  32.323  charging
    1328809275  33.133  charging
`;

// helper function for creating test doubles of execa.sync
function stdout(value) {
  return () => ({
    stdout: value,
  });
}

describe('models/hardware-info.js', function() {
  afterEach(function() {
    td.reset();
  });

  describe('.isUsingBattery', function() {
    it('returns null for unsupported platforms', function() {
      expect(hwinfo.isUsingBattery('not-a-real-platform')).to.be.null;
    });

    describe('on FreeBSD', function() {
      it('returns false via apm when not on battery', function() {
        const stub = td.function(execa.sync);

        td.when(stub('apm'), { ignoreExtraArgs: true }).thenReturn({ stdout: '1\n' });
        td.when(stub('upower'), { ignoreExtraArgs: true }).thenThrow(new Error('command not found'));
        td.replace(execa, 'sync', stub);

        expect(hwinfo.isUsingBattery('freebsd')).to.be.false;
      });

      it('returns true via apm when on battery', function() {
        const stub = td.function(execa.sync);

        td.when(stub('apm'), { ignoreExtraArgs: true }).thenReturn({ stdout: '0\n' });
        td.when(stub('upower'), { ignoreExtraArgs: true }).thenThrow(new Error('command not found'));
        td.replace(execa, 'sync', stub);

        expect(hwinfo.isUsingBattery('freebsd')).to.be.true;
      });

      it('returns false via upower when not on battery', function() {
        const stub = td.function(execa.sync);

        td.when(stub('apm'), { ignoreExtraArgs: true }).thenThrow(new Error('command not found'));
        td.when(stub('upower'), { ignoreExtraArgs: true }).thenReturn({ stdout: UPOWER_AC_ON });
        td.replace(execa, 'sync', stub);

        expect(hwinfo.isUsingBattery('freebsd')).to.be.false;
      });

      it('returns true via upower when on battery', function() {
        const stub = td.function(execa.sync);

        td.when(stub('apm'), { ignoreExtraArgs: true }).thenThrow(new Error('command not found'));
        td.when(stub('upower'), { ignoreExtraArgs: true }).thenReturn({ stdout: UPOWER_AC_OFF });
        td.replace(execa, 'sync', stub);

        expect(hwinfo.isUsingBattery('freebsd')).to.be.true;
      });

      it('returns null when battery status cannot be determined', function() {
        const stub = td.function(execa.sync);

        td.when(stub(), { ignoreExtraArgs: true }).thenThrow(new Error('command not found'));
        td.replace(execa, 'sync', stub);

        expect(hwinfo.isUsingBattery('freebsd')).to.be.null;
      });
    });

    describe('on Linux', function() {
      it('returns false via /sys/class/power_supply when not on battery', function() {
        const execaStub = td.function(execa.sync);

        td.when(execaStub(), { ignoreExtraArgs: true }).thenThrow(new Error('command not found'));
        td.replace(execa, 'sync', execaStub);

        const readFileStub = td.function(fs.readFileSync);

        td.when(readFileStub(), { ignoreExtraArgs: true }).thenReturn('1\n');
        td.replace(fs, 'readFileSync', readFileStub);

        expect(hwinfo.isUsingBattery('linux')).to.be.false;
      });

      it('returns true via /sys/class/power_supply when on battery', function() {
        const execaStub = td.function(execa.sync);

        td.when(execaStub(), { ignoreExtraArgs: true }).thenThrow(new Error('command not found'));
        td.replace(execa, 'sync', execaStub);

        const fsStub = td.function(fs.readFileSync);

        td.when(fsStub(), { ignoreExtraArgs: true }).thenReturn('0\n');
        td.replace(fs, 'readFileSync', fsStub);

        expect(hwinfo.isUsingBattery('linux')).to.be.true;
      });

      it('returns false via acpi when not on battery', function() {
        const execaStub = td.function(execa.sync);

        td.when(execaStub('acpi'), { ignoreExtraArgs: true }).thenReturn({ stdout: 'Adapter 0: on-line\n' });
        td.when(execaStub('upower'), { ignoreExtraArgs: true }).thenThrow(new Error('command not found'));
        td.replace(execa, 'sync', execaStub);

        const fsStub = td.function(fs.readFileSync);

        td.when(fsStub(), { ignoreExtraArgs: true }).thenThrow(new Error('file not found'));
        td.replace(fs, 'readFileSync', fsStub);

        expect(hwinfo.isUsingBattery('linux')).to.be.false;
      });

      it('returns true via acpi when on battery', function() {
        const execaStub = td.function(execa.sync);

        td.when(execaStub('acpi'), { ignoreExtraArgs: true }).thenReturn({ stdout: 'Adapter 0: off-line\n' });
        td.when(execaStub('upower'), { ignoreExtraArgs: true }).thenThrow(new Error('command not found'));
        td.replace(execa, 'sync', execaStub);

        const fsStub = td.function(fs.readFileSync);

        td.when(fsStub(), { ignoreExtraArgs: true }).thenThrow(new Error('file not found'));
        td.replace(fs, 'readFileSync', fsStub);

        expect(hwinfo.isUsingBattery('linux')).to.be.true;
      });

      it('returns false via upower when not on battery', function() {
        const execaStub = td.function(execa.sync);

        td.when(execaStub('acpi'), { ignoreExtraArgs: true }).thenThrow(new Error('command not found'));
        td.when(execaStub('upower', ['--enumerate'])).thenReturn({ stdout: 'foo\n' });
        td.when(execaStub('upower', ['--show-info', 'foo'])).thenReturn({ stdout: UPOWER_AC_ON });
        td.replace(execa, 'sync', execaStub);

        const fsStub = td.function(fs.readFileSync);

        td.when(fsStub(), { ignoreExtraArgs: true }).thenThrow(new Error('file not found'));
        td.replace(fs, 'readFileSync', fsStub);

        expect(hwinfo.isUsingBattery('linux')).to.be.false;
      });

      it('returns true via upower when on battery', function() {
        const execaStub = td.function(execa.sync);

        td.when(execaStub('acpi'), { ignoreExtraArgs: true }).thenThrow(new Error('command not found'));
        td.when(execaStub('upower', ['--enumerate'])).thenReturn({ stdout: 'foo\n' });
        td.when(execaStub('upower', ['--show-info', 'foo'])).thenReturn({ stdout: UPOWER_AC_OFF });
        td.replace(execa, 'sync', execaStub);

        const fsStub = td.function(fs.readFileSync);

        td.when(fsStub(), { ignoreExtraArgs: true }).thenThrow(new Error('file not found'));
        td.replace(fs, 'readFileSync', fsStub);

        expect(hwinfo.isUsingBattery('linux')).to.be.true;
      });

      it('returns null when battery status cannot be determined', function() {
        const execaStub = td.function(execa.sync);

        td.when(execaStub(), { ignoreExtraArgs: true }).thenThrow(new Error('command not found'));
        td.replace(execa, 'sync', execaStub);

        const fsStub = td.function(fs.readFileSync);

        td.when(fsStub(), { ignoreExtraArgs: true }).thenThrow(new Error('file not found'));
        td.replace(fs, 'readFileSync', fsStub);

        expect(hwinfo.isUsingBattery('linux')).to.be.null;
      });
    });

    describe('on macOS', function() {
      it('returns false when not on battery', function() {
        td.replace(
          execa,
          'sync',
          stdout(`Now drawing from 'AC Power'
-InternalBattery-0 (id=5636195)	100%; charged; 0:00 remaining present: true
`)
        );

        expect(hwinfo.isUsingBattery('darwin')).to.be.false;
      });

      it('returns true when on battery', function() {
        td.replace(
          execa,
          'sync',
          stdout(`Now drawing from 'Battery Power'
-InternalBattery-0 (id=5636195)	100%; discharging; (no estimate) present: true
`)
        );

        expect(hwinfo.isUsingBattery('darwin')).to.be.true;
      });

      it('returns null when an error occurs', function() {
        const stub = td.function(execa.sync);

        td.when(stub(), { ignoreExtraArgs: true }).thenThrow(new Error('whoops!'));
        td.replace(execa, 'sync', stub);

        expect(hwinfo.isUsingBattery('darwin')).to.be.null;
      });
    });

    describe('on OpenBSD', function() {
      it('returns false via apm when not on battery', function() {
        const stub = td.function(execa.sync);

        td.when(stub('apm'), { ignoreExtraArgs: true }).thenReturn({ stdout: '1\n' });
        td.when(stub('upower'), { ignoreExtraArgs: true }).thenThrow(new Error('command not found'));
        td.replace(execa, 'sync', stub);

        expect(hwinfo.isUsingBattery('openbsd')).to.be.false;
      });

      it('returns true via apm when on battery', function() {
        const stub = td.function(execa.sync);

        td.when(stub('apm'), { ignoreExtraArgs: true }).thenReturn({ stdout: '0\n' });
        td.when(stub('upower'), { ignoreExtraArgs: true }).thenThrow(new Error('command not found'));
        td.replace(execa, 'sync', stub);

        expect(hwinfo.isUsingBattery('openbsd')).to.be.true;
      });

      it('returns false via upower when not on battery', function() {
        const stub = td.function(execa.sync);

        td.when(stub('apm'), { ignoreExtraArgs: true }).thenThrow(new Error('command not found'));
        td.when(stub('upower'), { ignoreExtraArgs: true }).thenReturn({ stdout: UPOWER_AC_ON });
        td.replace(execa, 'sync', stub);

        expect(hwinfo.isUsingBattery('openbsd')).to.be.false;
      });

      it('returns true via upower when on battery', function() {
        const stub = td.function(execa.sync);

        td.when(stub('apm'), { ignoreExtraArgs: true }).thenThrow(new Error('command not found'));
        td.when(stub('upower'), { ignoreExtraArgs: true }).thenReturn({ stdout: UPOWER_AC_OFF });
        td.replace(execa, 'sync', stub);

        expect(hwinfo.isUsingBattery('openbsd')).to.be.true;
      });

      it('returns null when battery status cannot be determined', function() {
        const stub = td.function(execa.sync);

        td.when(stub(), { ignoreExtraArgs: true }).thenThrow(new Error('command not found'));
        td.replace(execa, 'sync', stub);

        expect(hwinfo.isUsingBattery('openbsd')).to.be.null;
      });
    });

    describe('on Windows', function() {
      it('returns false when not on battery', function() {
        td.replace(
          execa,
          'sync',
          stdout(`

PowerOnline=TRUE



`)
        );

        expect(hwinfo.isUsingBattery('win32')).to.be.false;
      });

      it('returns true when on battery', function() {
        td.replace(
          execa,
          'sync',
          stdout(`

PowerOnline=FALSE



`)
        );

        expect(hwinfo.isUsingBattery('win32')).to.be.true;
      });

      it('returns null when an error occurs', function() {
        const stub = td.function(execa.sync);

        td.when(stub(), { ignoreExtraArgs: true }).thenThrow(new Error('whoops!'));
        td.replace(execa, 'sync', stub);

        expect(hwinfo.isUsingBattery('win32')).to.be.null;
      });
    });
  });

  describe('.memorySwapUsed', function() {
    it('returns null for unsupported platforms', function() {
      expect(hwinfo.memorySwapUsed('not-a-real-platform')).to.be.null;
    });

    it('returns the expected value on FreeBSD', function() {
      td.replace(
        execa,
        'sync',
        stdout(`Device           1K-blocks     Used    Avail Capacity
/dev/gpt/swapfs1   1048576      837  1047739     0%
/dev/gpt/swapfs2   1048576      985  1047591     0%
`)
      );

      expect(hwinfo.memorySwapUsed('freebsd')).to.equal(1865728);
    });

    it('returns null on FreeBSD when an error occurs', function() {
      const stub = td.function(execa.sync);

      td.when(stub(), { ignoreExtraArgs: true }).thenThrow(new Error('whoops!'));
      td.replace(execa, 'sync', stub);

      expect(hwinfo.memorySwapUsed('freebsd')).to.be.null;
    });

    it('returns the expected value on Linux', function() {
      td.replace(
        execa,
        'sync',
        stdout(`              total        used        free      shared  buff/cache   available
Mem:    67275370496  2743869440 41266409472  3447558144 23265091584 60482338816
Swap:   67448598528   121593856 67327004672
`)
      );

      expect(hwinfo.memorySwapUsed('linux')).to.equal(121593856);
    });

    it('returns null on Linux when an error occurs', function() {
      const stub = td.function(execa.sync);

      td.when(stub(), { ignoreExtraArgs: true }).thenThrow(new Error('whoops!'));
      td.replace(execa, 'sync', stub);

      expect(hwinfo.memorySwapUsed('linux')).to.be.null;
    });

    it('returns the expected value on macOS', function() {
      td.replace(
        execa,
        'sync',
        stdout(`vm.swapusage: total = 6144.00M  used = 4987.75M  free = 1156.25M  (encrypted)
`)
      );

      expect(hwinfo.memorySwapUsed('darwin')).to.equal(5230034944);
    });

    it('returns null on macOS when an error occurs', function() {
      const stub = td.function(execa.sync);

      td.when(stub(), { ignoreExtraArgs: true }).thenThrow(new Error('whoops!'));
      td.replace(execa, 'sync', stub);

      expect(hwinfo.memorySwapUsed('darwin')).to.be.null;
    });

    it('returns the expected value on OpenBSD', function() {
      td.replace(
        execa,
        'sync',
        stdout(`Device          512-blocks     Used    Avail Capacity
/dev/gpt/swapfs1   1048576      837  1047739     0%
/dev/gpt/swapfs2   1048576      985  1047591     0%
`)
      );

      expect(hwinfo.memorySwapUsed('openbsd')).to.equal(932864);
    });

    it('returns null on OpenBSD when an error occurs', function() {
      const stub = td.function(execa.sync);

      td.when(stub(), { ignoreExtraArgs: true }).thenThrow(new Error('whoops!'));
      td.replace(execa, 'sync', stub);

      expect(hwinfo.memorySwapUsed('openbsd')).to.be.null;
    });

    it('returns the expected value on Windows', function() {
      td.replace(
        execa,
        'sync',
        stdout(`

CurrentUsage=325



`)
      );

      expect(hwinfo.memorySwapUsed('win32')).to.equal(340787200);
    });

    it('returns null on Windows when an error occurs', function() {
      const stub = td.function(execa.sync);

      td.when(stub(), { ignoreExtraArgs: true }).thenThrow(new Error('whoops!'));
      td.replace(execa, 'sync', stub);

      expect(hwinfo.memorySwapUsed('win32')).to.be.null;
    });
  });

  describe('.processorLoad', function() {
    it('returns null on Windows', function() {
      expect(hwinfo.processorLoad('win32')).to.be.null;
    });
  });

  describe('.processorSpeed', function() {
    it("averages the processors' speeds", function() {
      td.replace(os, 'cpus', () => [{ speed: 1 }, { speed: 2 }, { speed: 3 }, { speed: 4 }, { speed: 5 }]);

      expect(hwinfo.processorSpeed()).to.equal(3);
    });
  });
});
