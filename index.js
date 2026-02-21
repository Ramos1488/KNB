const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000; // Railway сам назначит порт

// Указываем папку, где лежат твои HTML/CSS файлы (например, 'public')
app.use(express.static(path.join(__dirname, 'public')));

// Если index.html лежит в корне, а не в папке, используй это:
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
