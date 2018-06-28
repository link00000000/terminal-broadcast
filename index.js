const express = require('express')
const ansiToHtml = require('ansi-to-html')
const linebyline = require('linebyline')

const app = express()
const ansi = new ansiToHtml({
	fg: '#FFF',
	bg: '#000',
	newline: true
})

const http = require('http').Server(app)
const fs = require('fs')
const path = require('path')

const io = require('socket.io')(http)

const outputFileDir = path.join(__dirname, 'output.log')

http.listen(3000, () => {
	console.log('Express listening on port 3000')
})

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'page.html'))
})

io.on('connection', (socket) => {
	if(fs.existsSync(outputFileDir)) {
		let rl = linebyline(outputFileDir)
		rl.on('line', line => {
			let html = ansi.toHtml(line)
			socket.emit('data', html)
		}).on('error', (err) => {
			throw err
		})
	}
	console.log('Connection')
})

process.stdin.on('data', (data) => {
	let text = data.toString()
	let html = ansi.toHtml(text)
	console.log(text)
	if(fs.existsSync(outputFileDir)) {
		fs.appendFileSync(outputFileDir, text)
	} else {
		fs.writeFileSync(outputFileDir, text)
	}
	io.sockets.emit('data', html)
})

process.on('SIGINT', () => {
	fs.unlinkSync(outputFileDir)
	process.exit(1)
})