const fs = require('fs');
const path = require('path');
const util = require('util');

const readFileAsync = util.promisify(fs.readFile);

async function getBookByName(req, res) {
    try {
        const { name } = req.params;
        const filePath = path.join(__dirname, '../../public/books', `${name}.json`);

        const bookContent = await readFileAsync(filePath, 'utf8');
        res.json(JSON.parse(bookContent));
    } catch (error) {
        res.status(404).json({ message: 'Book not found' });
    }
}

module.exports = { getBookByName };