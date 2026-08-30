const express = require('express');
const cors = require('cors');

require('./db'); // inicializa el esquema al arrancar

const profileRouter = require('./routes/profile');
const weightRouter = require('./routes/weight');
const foodsRouter = require('./routes/foods');
const menuRouter = require('./routes/menu');
const logRouter = require('./routes/log');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/profile', profileRouter);
app.use('/api/weight', weightRouter);
app.use('/api/foods', foodsRouter);
app.use('/api/menu', menuRouter);
app.use('/api/log', logRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Nutrition API escuchando en http://localhost:${PORT}`);
});
