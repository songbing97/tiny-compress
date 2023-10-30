const vscode = require('vscode');
const path = require('path');
const axios = require('axios');
const { open } = require('fs/promises');
const fs = require('fs');
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let disposable = vscode.commands.registerCommand('minify_picture', async function (fileUri) {
		console.log('fileUri:', fileUri)
		const fileName = path.basename(fileUri.fsPath);
		vscode.window.showInformationMessage(`开始压缩${fileName}`);
		const fd = await open(fileUri.fsPath);

		axios.post('https://api.tinify.com/shrink', fs.createReadStream(fileUri.fsPath), {
			auth: {
				username: 'api',
				password: 'g4nmvpYKFptdZGhSZNsg7f593Pn77KP1'
			},
			headers: {
				'Content-Type': 'application/octet-stream',
			}
		}).then(res => {
			if (!res.status.match(/2\d{2}/g)) {
				vscode.window.showInformationMessage(`压缩${fileUri}失败`);
			} else {
				vscode.window.showInformationMessage(`压缩${fileUri}成功`);
			}
			console.log('res', res); // res.data.output.url
		}).catch(err => {
			console.log('err', err);
		}).finally(() => {
			console.log('finally');
		})
	});

	context.subscriptions.push(disposable);
}

function deactivate() {}

function downloadImage(url) {
	return new Promise((resolve, reject) => {
		axios.get(url, {
			responseType: 'stream'
		}).then(res => {
			console.log('res:', res)
		}).catch(err => {
			console.log('err:', err)
		})
	})
}

module.exports = {
	activate,
	deactivate
}
