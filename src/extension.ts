import * as vscode from 'vscode';
import Codeai from './codeai';
import Fbutil from './lib/fbutil';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "codeai" is now active!');

	let disposable = vscode.commands.registerCommand('codeai.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from codeai!');
	});
    context.subscriptions.push(disposable);
	let disposable1 = vscode.commands.registerCommand('codeai.submit', () => {
        vscode.window.showInformationMessage('i insert uppercase!');
        const text = Codeai.getTextOfCurrentEditor();
        if (text !== null) {
            Fbutil.chat(text).then( response => {
                if (response !== null){
                    Codeai.insertTextInCurrentEditor(response);
                }
            });
        }
	});
    context.subscriptions.push(disposable1);
}

export function deactivate() {}
