import { CommandBase, ICommand, IHooks } from '../../core/commandBase';
import { invoke } from '@midwayjs/invoke';

export class Invoke extends CommandBase {

  serverless: any;

  getCommand(): ICommand {
    return {};
  }

  getHooks(): IHooks {
    return {
      'invoke:invoke': async () => {
        if (this.options.remote) {
          return;
        }
        const func = this.options.function;
        this.serverless.cli.log(` - Invoke ${func}`);
        const result = await invoke({
          functionName: func,
          debug: this.options.debug,
          data: this.options.data,
          trigger: this.options.trigger
        });
        this.serverless.cli.log('--------- result start --------');
        this.serverless.cli.log(JSON.stringify(result));
        this.serverless.cli.log('--------- result end --------');
      }
    };
  }
}