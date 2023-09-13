import * as vscode from 'vscode';
import Codeai from './codeai';
import Fbutil from './lib/fbutil';

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('codeai');
  const model = config.get<string>('model')!; // ! is non-null assertion operator
  console.log(`activated model=${model}`);

  //   let disposable = vscode.commands.registerCommand('codeai.helloWorld', () => {
  //     vscode.window.showInformationMessage('Hello World from codeai!');
  //   });
  //   context.subscriptions.push(disposable);
  let disposable = vscode.commands.registerCommand(
    'codeai.chat_completion',
    () => {
      //vscode.window.showInformationMessage('codeai v27');
      const text = Codeai.getTextOfCurrentEditor();
      if (text !== null) {
        Fbutil.chat(text, model).then((response) => {
          if (response !== null) {
            Codeai.appendTextInCurrentEditor(response);
          }
        });
      }
    }
  );
  context.subscriptions.push(disposable);
}

export function deactivate() {}
