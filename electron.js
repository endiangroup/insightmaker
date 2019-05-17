const { app, Menu, MenuItem, BrowserWindow, dialog } = require('electron')
const { autoUpdater } = require("electron-updater")
const path = require('path'),
	  fs = require('fs'),
      crypto = require('crypto')
 
// TODO: optional
require('electron-reload')(__dirname, {
  electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
  hardResetMethod: 'exit'
});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ width: 800, height: 600 })

  // and load the index.html of the app.
  win.loadFile('public/index.html')

	// Open the DevTools.
	//win.webContents.openDevTools()
	win.on('close', (e) => {
		quitAndSaveIfRequested(win,e)
	});

	// Emitted when the window is closed.
	win.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		win = null
	})
}

let currentModelFile = '',
	currentModelHash = ''

function setWindowTitle(browserWindow,title) {
	browserWindow.webContents.executeJavaScript('setTitle(\''+title+'\')');
}

function newModel(menuItem, browserWindow, event) {
	browserWindow.webContents.executeJavaScript('FileManagerWeb.newModel()');
	currentModelFile = '';
	setWindowTitle(browserWindow, 'Untitled Insight')
}

function openModel(menuItem, browserWindow, event) {
	let defaultPath = 'model.InsightMaker';
	if (currentModelFile != '') {
		defaultPath = currentModelFile
	}

	dialog.showOpenDialog(browserWindow, 
		{
			defaultPath: defaultPath,
		},
		function (filePaths) {
			if (filePaths === undefined) {
				return;
			}

			var filePath = filePaths[0];

			try {
				let contents = fs.readFileSync(filePath, 'utf-8');
				browserWindow.webContents.executeJavaScript('importMXGraph(\''+contents+'\')');
				currentModelFile = filePath;
				currentModelHash = hashModelXML(contents)
				setWindowTitle(browserWindow,filePath);
			} catch (err) {
				console.log('Error reading the file: ' + JSON.stringify(err));
			}
		});
}

function saveModelAs(menuItem, browserWindow, event) {
	return new Promise(function(resolve, reject) {
		let defaultPath = 'model.InsightMaker';
		if (currentModelFile != '') {
			defaultPath = currentModelFile
		}

		dialog.showSaveDialog(browserWindow, {
			defaultPath: defaultPath,
		},
			function (filePath) {
				if (filePath === undefined) {
					return;
				}

				currentModelFile = filePath;

				browserWindow.webContents.executeJavaScript('getModelXML2()', function(xml) {
					fs.writeFile(filePath, xml, function (err) {
						if (err) {
							reject(err)
						}

						currentModelHash = hashModelXML(xml)
						setWindowTitle(browserWindow,filePath);
						resolve()
					});
				});
			});
	})
}

function saveModel(menuItem, browserWindow, event) {
	if (currentModelFile == '') {
		return saveModelAs(menuItem,browserWindow,event)
	}

	return new Promise(function(resolve, reject) {
		browserWindow.webContents.executeJavaScript('getModelXML2()', function(xml) {
			fs.writeFile(currentModelFile, xml, function (err) {
				if (err) {
					reject(err)
				}
				currentModelHash = hashModelXML(xml)
				resolve()
			});
		});
	})
}

let exitConfirmed = false

function quitAndSaveIfRequested(browserWindow, event) {
	if (exitConfirmed) {
		return
	}

	event.preventDefault()
	getModelXML(browserWindow).then((xml) => {	

		if (hashModelXML(xml) == currentModelHash) {
			exitConfirmed = true
			browserWindow.close()
			return
		}

		var choice = dialog.showMessageBox(
			browserWindow,
			{
				type: 'question',
				buttons: [ 'No, discard changes', 'Yes, save changes' ],
				title: 'Confirm',
				message: 'You have unsaved changes! Would you like to save before exiting?'
			}
		);

		if(choice == 1){
			saveModel( null, browserWindow, event ).then(() => {
				browserWindow.close()
			})
		} else {
			exitConfirmed = true
			browserWindow.close()
		}
	})
}

function hashModelXML(xml) {
	return crypto.createHash('md5').update(xml).digest('hex')
}

function getModelXML(browserWindow) {
	return new Promise(function(resolve, reject) {
		browserWindow.webContents.executeJavaScript('getModelXML2()', function(xml) {
			resolve(xml)
		});
	})
}

const template = [
	{
		label: 'File',
		submenu: [
			{
				label: 'New model',
				accelerator: 'CommandOrControl+N',
				click: newModel,
			},
			{
				label: 'Open model...',
				accelerator: 'CommandOrControl+O',
				click: openModel,
			},
			{
				label: 'Save model',
				accelerator: 'CommandOrControl+S',
				click: saveModel,
			},
			{
				label: 'Save model as...',
				accelerator: 'CommandOrControl+Shift+S',
				click: saveModelAs,
			},
			{
				type: 'separator'
			},
			{
				role: 'quit'
			},
		]
	},

	{
		label: 'View',
		submenu: [
			{
				role: 'reload'
			},
			{
				role: 'toggledevtools'
			},
			{
				type: 'separator'
			},
			{
				role: 'resetzoom'
			},
			{
				role: 'zoomin'
			},
			{
				role: 'zoomout'
			},
			{
				type: 'separator'
			},
			{
				role: 'togglefullscreen'
			}
		]
	},
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
	autoUpdater.checkForUpdatesAndNotify()
	createWindow()
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null) {
		createWindow()
	}
})
