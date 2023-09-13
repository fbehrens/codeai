import * as vscode from 'vscode';
import Codai from './codai';
import Fbutil from './lib/fbutil';

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('codai');
  const model = config.get<string>('model')!; // ! is non-null assertion operator
  console.log(`activated model=${model}`);

  //   let disposable = vscode.commands.registerCommand('codai.helloWorld', () => {
  //     vscode.window.showInformationMessage('Hello World from codai!');
  //   });
  //   context.subscriptions.push(disposable);
  let disposable = vscode.commands.registerCommand(
    'codai.chat_completion',
    () => {
      //vscode.window.showInformationMessage('codai v27');
      const text = Codai.getTextOfCurrentEditor();
      if (text !== null) {
        Fbutil.chat(text, model).then((response) => {
          if (response !== null) {
            Codai.appendTextInCurrentEditor(response);
          }
        });
      }
    }
  );
  context.subscriptions.push(disposable);
}

export function deactivate() {}
