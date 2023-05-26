import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
  const provider = new GoProvider()
  const errProvider = vscode.languages.registerCompletionItemProvider('go', provider, '.')
  const bracketsProvider = vscode.languages.registerCompletionItemProvider('go', provider, ',')

  const varCheckError = vscode.commands.registerCommand('go-err.varCheckError', () => {
    const editor = vscode.window.activeTextEditor!
    const active = editor.selection.active
    const text = editor.document.lineAt(active.line).text
    const func = text.split('.varCheckError')[0].trimStart()
    const funcName = func.split('.')[1].split('()')[0]
    const range = new vscode.Range(
      new vscode.Position(active.line, active.character - text.trimStart().length),
      new vscode.Position(active.line, active.character)
    )

    const snippet = new vscode.SnippetString(
      `\${1:${funcName}}, err := ${func}\nif err != nil {\n\t\${0:return}\n}`
    )
    editor.insertSnippet(snippet, range)
  })

  context.subscriptions.push(errProvider, bracketsProvider, varCheckError)
}

// This method is called when your extension is deactivated
export function deactivate() {}

class GoProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
    if (this.isShowVarCheckError(document, position)) {
      const cmd = new vscode.CompletionItem('varCheckError', vscode.CompletionItemKind.Method)
      cmd.command = { command: 'go-err.varCheckError', title: 'varCheckError' }
      return [cmd]
    }

    if (this.isShowBrackets(document, position)) {
      const line = document.lineAt(position)
      const word = line.text.split(')')[1].trimStart()
      const editor = vscode.window.activeTextEditor!
      editor.insertSnippet(
        new vscode.SnippetString(`(${word}$0)`),
        new vscode.Range(
          new vscode.Position(line.lineNumber, line.range.end.character - word.length),
          position
        )
      )
    }
  }

  private isShowVarCheckError(document: vscode.TextDocument, position: vscode.Position) {
    const line = document.lineAt(position)
    return line.text.endsWith(').')
  }

  private isShowBrackets(document: vscode.TextDocument, position: vscode.Position) {
    const line = document.lineAt(position.line)
    return (
      line.text.match(/\w\((\b\w+.*)?\)\s?\w/g) &&
      line.text.endsWith(',') &&
      !line.text.includes(':=')
    )
  }
}
