import * as CommandHookCore from '..';
import InvokePlugin from './plugins/test.invoke';
import LogPlugin from './plugins/test.lg';
import OnePlugin from './plugins/one.common';
import * as assert from 'assert';
import MidwayFaaSPackagePlugin from '@ali/midway-faas-plugin-test-package';
import { loadSpec } from '../../faas-plugin-common/src/utils/loadSpec';
import * as path from 'path';
import * as fs from 'fs';

describe('load plugin', () => {
  it('sigle plugin and lifecycleEvents', async () => {
    const core = new CommandHookCore({
      provider: 'test',
      options: {},
    });
    core.addPlugin(InvokePlugin);
    await core.ready();
    const allCommands = core.getCommands();
    assert(allCommands.invoke && allCommands.invoke.lifecycleEvents.length === 2);
  });

  it('multi plugins', async () => {
    const core = new CommandHookCore({
      provider: 'test',
      options: {},
    });
    core.addPlugin(InvokePlugin);
    core.addPlugin(LogPlugin);
    await core.ready();
    const allCommands = core.getCommands();
    assert(allCommands.invoke && allCommands.log);
  });

  it('different provider plugins', async () => {
    const core = new CommandHookCore({
      provider: 'one',
      options: {},
    });
    core.addPlugin(InvokePlugin);
    core.addPlugin(LogPlugin);
    core.addPlugin(OnePlugin);
    await core.ready();
    const allCommands = core.getCommands();
    assert(!allCommands.invoke && !allCommands.log && allCommands.common);
  });
});

describe('invoke', () => {
  it('invoke plugin call and hack log', async () => {
    const result: string[] = [];
    const core = new CommandHookCore({
      provider: 'test',
      options: {
        f: 'index',
      },
      log: {
        log: (msg: string) => {
          result.push(msg);
        },
      },
    });
    core.addPlugin(InvokePlugin);
    await core.ready();
    await core.invoke(['invoke']);
    assert(
      result.length === 6 &&
        result[1] === 'invoke:one' &&
        result[3] === 'before:invoke:two'
    );
  });

  it('use log plugin call invoke plugin', async () => {
    const result: string[] = [];
    const core = new CommandHookCore({
      provider: 'test',
      options: {},
      log: {
        log: (msg: string) => {
          result.push(msg);
        },
      },
    });
    core.addPlugin(InvokePlugin);
    core.addPlugin(LogPlugin);
    await core.ready();
    await core.invoke(['log']);
    assert(
      result.length === 6 &&
        result[1] === 'invoke:one' &&
        result[3] === 'before:invoke:two'
    );
  });
});

describe('package', () => {
  it('use package plugin', async () => {
    const result: string[] = [];
    const baseDir = path.join(__dirname, './demo');
    const spec = loadSpec(baseDir);
    const specFilePath = path.join(baseDir, 'f.yml');
    const core = new CommandHookCore({
      provider: 'package',
      service: spec,
      config: {
        servicePath: baseDir,
        specFilePath,
        specFileName: 'f.yml',
      },
      log: {
        log: (msg: string) => {
          result.push(msg);
        },
      },
    });
    core.addPlugin(MidwayFaaSPackagePlugin);
    await core.ready();
    await core.invoke(['package']);
    // dist
    const distSpec = path.join(__dirname, './demo/.serverless/.spec');
    const distFunction = path.join(__dirname, './demo/.serverless/functions');
    assert(
      fs.existsSync(distSpec) === true && fs.existsSync(distFunction) === true
    );
  });
});
